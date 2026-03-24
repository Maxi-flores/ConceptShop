import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { reserveStock, releaseStock, confirmStockSale, calculateBulkPrice } from './products'

// Collection references
const ordersCollection = collection(db, 'orders')
const groupOrdersCollection = collection(db, 'groupOrders')

// Create individual order
export const createOrder = async (userId, items, shippingAddress, groupOrderId = null) => {
  try {
    const batch = writeBatch(db)

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const productDoc = await getDoc(doc(db, 'products', item.productId))
      if (!productDoc.exists()) {
        throw new Error(`Product ${item.productId} not found`)
      }

      const product = productDoc.data()
      let price = product.basePrice

      // Apply bulk pricing if part of group order
      if (groupOrderId) {
        const groupOrderDoc = await getDoc(doc(db, 'groupOrders', groupOrderId))
        if (groupOrderDoc.exists()) {
          const groupData = groupOrderDoc.data()
          const productGroup = groupData.products.find(p => p.productId === item.productId)
          if (productGroup) {
            price = calculateBulkPrice(product, item.quantity, productGroup.totalQuantity)
          }
        }
      }

      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: price,
        total: itemTotal
      })

      // Reserve stock
      await reserveStock(item.productId, item.quantity)
    }

    // Create order document
    const orderRef = await addDoc(ordersCollection, {
      userId,
      groupOrderId,
      items: orderItems,
      subtotal,
      shipping: 0, // Calculated later
      tax: subtotal * 0.21, // 21% VAT
      total: subtotal * 1.21,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update stakeholder order contribution
    const stakeholderRef = doc(db, 'stakeholders', userId)
    await updateDoc(stakeholderRef, {
      orderContribution: increment(subtotal),
      lastActivityAt: serverTimestamp()
    })

    return orderRef.id
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Create group order
export const createGroupOrder = async (creatorId, productId, targetQuantity, deadline) => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (!productDoc.exists()) {
      throw new Error('Product not found')
    }

    const product = productDoc.data()

    const groupOrderRef = await addDoc(groupOrdersCollection, {
      creatorId,
      products: [{
        productId,
        productName: product.name,
        targetQuantity,
        currentQuantity: 0,
        basePrice: product.basePrice,
        currentPrice: product.basePrice,
        bulkPricing: product.bulkPricing || []
      }],
      participants: [],
      status: 'open',
      deadline: deadline,
      shippingOption: 'aggregated', // aggregated, individual
      aggregationAddress: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return groupOrderRef.id
  } catch (error) {
    console.error('Error creating group order:', error)
    throw error
  }
}

// Join group order
export const joinGroupOrder = async (groupOrderId, userId, productId, quantity) => {
  try {
    const groupOrderRef = doc(db, 'groupOrders', groupOrderId)
    const groupOrderDoc = await getDoc(groupOrderRef)

    if (!groupOrderDoc.exists()) {
      throw new Error('Group order not found')
    }

    const groupOrder = groupOrderDoc.data()

    if (groupOrder.status !== 'open') {
      throw new Error('Group order is no longer accepting participants')
    }

    // Update product quantity in group
    const products = groupOrder.products.map(p => {
      if (p.productId === productId) {
        const newQuantity = p.currentQuantity + quantity
        const productWithQuantity = { ...p, currentQuantity: newQuantity }

        // Recalculate price based on new total
        const bulkTier = p.bulkPricing
          .filter(tier => newQuantity >= tier.minQuantity)
          .sort((a, b) => b.minQuantity - a.minQuantity)[0]

        if (bulkTier) {
          productWithQuantity.currentPrice = bulkTier.discountType === 'percentage'
            ? p.basePrice * (1 - bulkTier.discount / 100)
            : p.basePrice - bulkTier.discount
        }

        return productWithQuantity
      }
      return p
    })

    // Add participant
    const participants = [
      ...groupOrder.participants,
      {
        userId,
        productId,
        quantity,
        joinedAt: new Date()
      }
    ]

    await updateDoc(groupOrderRef, {
      products,
      participants,
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error joining group order:', error)
    throw error
  }
}

// Finalize group order
export const finalizeGroupOrder = async (groupOrderId, aggregationAddress = null) => {
  try {
    const groupOrderRef = doc(db, 'groupOrders', groupOrderId)
    const groupOrderDoc = await getDoc(groupOrderRef)

    if (!groupOrderDoc.exists()) {
      throw new Error('Group order not found')
    }

    const groupOrder = groupOrderDoc.data()

    // Create individual orders for each participant
    const participantOrders = {}
    for (const participant of groupOrder.participants) {
      if (!participantOrders[participant.userId]) {
        participantOrders[participant.userId] = []
      }
      participantOrders[participant.userId].push({
        productId: participant.productId,
        quantity: participant.quantity
      })
    }

    // Create orders
    const orderIds = []
    for (const [userId, items] of Object.entries(participantOrders)) {
      const userDoc = await getDoc(doc(db, 'users', userId))
      const shippingAddress = aggregationAddress || userDoc.data()?.shippingAddress || {}

      const orderId = await createOrder(userId, items, shippingAddress, groupOrderId)
      orderIds.push(orderId)
    }

    // Update group order status
    await updateDoc(groupOrderRef, {
      status: 'finalized',
      finalizedAt: serverTimestamp(),
      orderIds,
      aggregationAddress,
      updatedAt: serverTimestamp()
    })

    return orderIds
  } catch (error) {
    console.error('Error finalizing group order:', error)
    throw error
  }
}

// Subscribe to user's orders
export const subscribeToUserOrders = (userId, callback) => {
  const q = query(
    ordersCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(orders)
  })
}

// Subscribe to group orders
export const subscribeToGroupOrders = (callback, status = null) => {
  let q = query(groupOrdersCollection, orderBy('createdAt', 'desc'))

  if (status) {
    q = query(q, where('status', '==', status))
  }

  return onSnapshot(q, (snapshot) => {
    const groupOrders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(groupOrders)
  })
}

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId)

    if (status === 'confirmed') {
      const orderDoc = await getDoc(orderRef)
      if (orderDoc.exists()) {
        const order = orderDoc.data()
        for (const item of order.items) {
          await confirmStockSale(item.productId, item.quantity)
        }
      }
    }

    if (status === 'cancelled') {
      const orderDoc = await getDoc(orderRef)
      if (orderDoc.exists()) {
        const order = orderDoc.data()
        for (const item of order.items) {
          await releaseStock(item.productId, item.quantity)
        }
      }
    }

    await updateDoc(orderRef, {
      status,
      [`${status}At`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

// Get order statistics
export const getOrderStats = async (startDate, endDate) => {
  try {
    const q = query(
      ordersCollection,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    )
    const snapshot = await getDocs(q)

    const stats = {
      totalOrders: snapshot.size,
      totalRevenue: 0,
      avgOrderValue: 0,
      statusBreakdown: {}
    }

    snapshot.docs.forEach(doc => {
      const order = doc.data()
      stats.totalRevenue += order.total || 0
      stats.statusBreakdown[order.status] = (stats.statusBreakdown[order.status] || 0) + 1
    })

    stats.avgOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0

    return stats
  } catch (error) {
    console.error('Error getting order stats:', error)
    throw error
  }
}
