import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './config'

// Collection references
const productsCollection = collection(db, 'products')
const allocationsCollection = collection(db, 'productAllocations')

// Create product
export const createProduct = async (productData, images = []) => {
  try {
    // Upload images first
    const imageUrls = await Promise.all(
      images.map(async (file, index) => {
        const storageRef = ref(storage, `products/${Date.now()}_${index}_${file.name}`)
        await uploadBytes(storageRef, file)
        return getDownloadURL(storageRef)
      })
    )

    const docRef = await addDoc(productsCollection, {
      ...productData,
      images: imageUrls,
      stock: productData.stock || 0,
      reservedStock: 0,
      soldCount: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return docRef.id
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

// Update product
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (productDoc.exists()) {
      // Delete images from storage
      const images = productDoc.data().images || []
      await Promise.all(
        images.map(async (url) => {
          try {
            const imageRef = ref(storage, url)
            await deleteObject(imageRef)
          } catch (e) {
            console.warn('Could not delete image:', e)
          }
        })
      )
    }

    await deleteDoc(productRef)
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

// Get single product
export const getProduct = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting product:', error)
    throw error
  }
}

// Subscribe to products
export const subscribeToProducts = (callback, filters = {}) => {
  let q = query(productsCollection, orderBy('createdAt', 'desc'))

  if (filters.category) {
    q = query(q, where('category', '==', filters.category))
  }

  if (filters.status) {
    q = query(q, where('status', '==', filters.status))
  }

  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(products)
  })
}

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const q = query(
      productsCollection,
      where('category', '==', category),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting products by category:', error)
    throw error
  }
}

// Reserve stock for group order
export const reserveStock = async (productId, quantity) => {
  try {
    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error('Product not found')
    }

    const data = productDoc.data()
    const availableStock = data.stock - data.reservedStock

    if (quantity > availableStock) {
      throw new Error('Insufficient stock')
    }

    await updateDoc(productRef, {
      reservedStock: increment(quantity),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('Error reserving stock:', error)
    throw error
  }
}

// Release reserved stock
export const releaseStock = async (productId, quantity) => {
  try {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      reservedStock: increment(-quantity),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error releasing stock:', error)
    throw error
  }
}

// Confirm stock sale (move from reserved to sold)
export const confirmStockSale = async (productId, quantity) => {
  try {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      stock: increment(-quantity),
      reservedStock: increment(-quantity),
      soldCount: increment(quantity),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error confirming stock sale:', error)
    throw error
  }
}

// Calculate bulk pricing
export const calculateBulkPrice = (product, quantity, totalGroupQuantity = 0) => {
  const basePrice = product.basePrice
  const bulkTiers = product.bulkPricing || []
  const combinedQuantity = quantity + totalGroupQuantity

  // Find applicable tier
  const applicableTier = bulkTiers
    .filter(tier => combinedQuantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]

  if (applicableTier) {
    if (applicableTier.discountType === 'percentage') {
      return basePrice * (1 - applicableTier.discount / 100)
    } else {
      return basePrice - applicableTier.discount
    }
  }

  return basePrice
}

// Get product categories
export const getCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'categories'))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting categories:', error)
    throw error
  }
}

// ========================================
// PRODUCT INVESTMENT ALLOCATION FUNCTIONS
// ========================================

// Subscribe to all allocations for a specific product
export const subscribeToProductAllocations = (productId, callback) => {
  const q = query(
    allocationsCollection,
    where('productId', '==', productId)
  )

  return onSnapshot(q, (snapshot) => {
    const allocations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(allocations)
  })
}

// Subscribe to all product allocation stats (for Stock page overview)
export const subscribeToAllProductStats = (stakeholders, callback) => {
  return onSnapshot(allocationsCollection, (snapshot) => {
    const allAllocations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Group allocations by product
    const statsByProduct = {}
    const totalPoolAmount = stakeholders.reduce((sum, s) => sum + (s.investmentAmount || 0), 0)
    const totalStakeholders = stakeholders.length

    allAllocations.forEach(allocation => {
      const productId = allocation.productId
      if (!statsByProduct[productId]) {
        statsByProduct[productId] = {
          stakeholderCount: 0,
          totalAllocatedAmount: 0,
          allocations: []
        }
      }

      if (allocation.allocationPercentage > 0) {
        statsByProduct[productId].stakeholderCount++

        // Find stakeholder's investment amount
        const stakeholder = stakeholders.find(s => s.id === allocation.userId)
        if (stakeholder) {
          const allocatedAmount = (stakeholder.investmentAmount || 0) * (allocation.allocationPercentage / 100)
          statsByProduct[productId].totalAllocatedAmount += allocatedAmount
        }
      }
      statsByProduct[productId].allocations.push(allocation)
    })

    // Calculate rates for each product
    Object.keys(statsByProduct).forEach(productId => {
      const stats = statsByProduct[productId]
      stats.totalStakeholders = totalStakeholders
      stats.totalPoolAmount = totalPoolAmount
      stats.participationRate = totalStakeholders > 0
        ? (stats.stakeholderCount / totalStakeholders) * 100
        : 0
      stats.allocationRate = totalPoolAmount > 0
        ? (stats.totalAllocatedAmount / totalPoolAmount) * 100
        : 0
    })

    callback(statsByProduct)
  })
}

// Get investment stats for a specific product
export const getProductInvestmentStats = async (productId, stakeholders) => {
  try {
    const q = query(allocationsCollection, where('productId', '==', productId))
    const snapshot = await getDocs(q)
    const allocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const totalPoolAmount = stakeholders.reduce((sum, s) => sum + (s.investmentAmount || 0), 0)
    const totalStakeholders = stakeholders.length

    let stakeholderCount = 0
    let totalAllocatedAmount = 0

    allocations.forEach(allocation => {
      if (allocation.allocationPercentage > 0) {
        stakeholderCount++
        const stakeholder = stakeholders.find(s => s.id === allocation.userId)
        if (stakeholder) {
          totalAllocatedAmount += (stakeholder.investmentAmount || 0) * (allocation.allocationPercentage / 100)
        }
      }
    })

    return {
      stakeholderCount,
      totalStakeholders,
      participationRate: totalStakeholders > 0 ? (stakeholderCount / totalStakeholders) * 100 : 0,
      totalAllocatedAmount,
      totalPoolAmount,
      allocationRate: totalPoolAmount > 0 ? (totalAllocatedAmount / totalPoolAmount) * 100 : 0
    }
  } catch (error) {
    console.error('Error getting product investment stats:', error)
    throw error
  }
}

// Update user's allocation for a product
export const updateProductAllocation = async (productId, userId, percentage) => {
  try {
    const allocationId = `${productId}_${userId}`
    const allocationRef = doc(db, 'productAllocations', allocationId)

    await setDoc(allocationRef, {
      productId,
      userId,
      allocationPercentage: Math.max(0, Math.min(100, percentage)),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true })

    return allocationId
  } catch (error) {
    console.error('Error updating product allocation:', error)
    throw error
  }
}

// Get all allocations for a specific user
export const getUserAllocations = async (userId) => {
  try {
    const q = query(allocationsCollection, where('userId', '==', userId))
    const snapshot = await getDocs(q)

    const allocations = {}
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      allocations[data.productId] = data.allocationPercentage
    })

    return allocations
  } catch (error) {
    console.error('Error getting user allocations:', error)
    throw error
  }
}

// Subscribe to user's allocations (real-time)
export const subscribeToUserAllocations = (userId, callback) => {
  const q = query(allocationsCollection, where('userId', '==', userId))

  return onSnapshot(q, (snapshot) => {
    const allocations = {}
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      allocations[data.productId] = data.allocationPercentage
    })
    callback(allocations)
  })
}
