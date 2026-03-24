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
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

// Collection reference
const shipmentsCollection = collection(db, 'shipments')

// Carrier configurations
const CARRIERS = {
  ups: {
    name: 'UPS',
    trackingUrl: 'https://www.ups.com/track?tracknum=',
    apiEndpoint: import.meta.env.VITE_UPS_API_KEY ? 'https://onlinetools.ups.com/api' : null
  },
  fedex: {
    name: 'FedEx',
    trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=',
    apiEndpoint: import.meta.env.VITE_FEDEX_API_KEY ? 'https://apis.fedex.com' : null
  },
  dhl: {
    name: 'DHL',
    trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=',
    apiEndpoint: import.meta.env.VITE_DHL_API_KEY ? 'https://api-eu.dhl.com' : null
  },
  manual: {
    name: 'Other/Manual',
    trackingUrl: null,
    apiEndpoint: null
  }
}

// Create shipment
export const createShipment = async (shipmentData) => {
  try {
    const shipmentRef = await addDoc(shipmentsCollection, {
      ...shipmentData,
      status: 'pending',
      trackingHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return shipmentRef.id
  } catch (error) {
    console.error('Error creating shipment:', error)
    throw error
  }
}

// Create aggregated shipment (combining multiple orders)
export const createAggregatedShipment = async (orderIds, aggregationAddress) => {
  try {
    // Get all orders
    const orders = await Promise.all(
      orderIds.map(async (orderId) => {
        const orderDoc = await getDoc(doc(db, 'orders', orderId))
        return { id: orderId, ...orderDoc.data() }
      })
    )

    // Calculate combined weight/dimensions (simplified)
    const totalItems = orders.reduce((acc, order) =>
      acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0
    )

    const shipmentRef = await addDoc(shipmentsCollection, {
      type: 'aggregated',
      orderIds,
      destination: aggregationAddress,
      carrier: null,
      trackingNumber: null,
      estimatedItems: totalItems,
      status: 'pending',
      trackingHistory: [{
        status: 'created',
        timestamp: new Date(),
        description: `Aggregated shipment created for ${orderIds.length} orders`
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update orders with shipment reference
    await Promise.all(
      orderIds.map(orderId =>
        updateDoc(doc(db, 'orders', orderId), {
          shipmentId: shipmentRef.id,
          updatedAt: serverTimestamp()
        })
      )
    )

    return shipmentRef.id
  } catch (error) {
    console.error('Error creating aggregated shipment:', error)
    throw error
  }
}

// Update tracking information
export const updateTracking = async (shipmentId, carrier, trackingNumber) => {
  try {
    const shipmentRef = doc(db, 'shipments', shipmentId)
    const shipmentDoc = await getDoc(shipmentRef)

    if (!shipmentDoc.exists()) {
      throw new Error('Shipment not found')
    }

    const currentHistory = shipmentDoc.data().trackingHistory || []

    await updateDoc(shipmentRef, {
      carrier,
      trackingNumber,
      status: 'in_transit',
      trackingHistory: [
        ...currentHistory,
        {
          status: 'tracking_added',
          timestamp: new Date(),
          description: `Tracking number added: ${trackingNumber} (${CARRIERS[carrier]?.name || carrier})`
        }
      ],
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating tracking:', error)
    throw error
  }
}

// Add tracking event (manual or from API)
export const addTrackingEvent = async (shipmentId, event) => {
  try {
    const shipmentRef = doc(db, 'shipments', shipmentId)
    const shipmentDoc = await getDoc(shipmentRef)

    if (!shipmentDoc.exists()) {
      throw new Error('Shipment not found')
    }

    const currentHistory = shipmentDoc.data().trackingHistory || []

    await updateDoc(shipmentRef, {
      status: event.status || shipmentDoc.data().status,
      trackingHistory: [
        ...currentHistory,
        {
          ...event,
          timestamp: event.timestamp || new Date()
        }
      ],
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding tracking event:', error)
    throw error
  }
}

// Fetch tracking from carrier API
export const fetchCarrierTracking = async (shipmentId) => {
  try {
    const shipmentDoc = await getDoc(doc(db, 'shipments', shipmentId))

    if (!shipmentDoc.exists()) {
      throw new Error('Shipment not found')
    }

    const shipment = shipmentDoc.data()
    const carrier = CARRIERS[shipment.carrier]

    if (!carrier?.apiEndpoint) {
      return { success: false, message: 'Carrier API not configured' }
    }

    // This would make actual API calls in production
    // For now, we simulate the response
    const mockTrackingData = {
      status: 'in_transit',
      events: [
        {
          status: 'in_transit',
          timestamp: new Date(),
          location: 'Distribution Center',
          description: 'Package in transit'
        }
      ]
    }

    // Update shipment with fetched data
    for (const event of mockTrackingData.events) {
      await addTrackingEvent(shipmentId, event)
    }

    return { success: true, data: mockTrackingData }
  } catch (error) {
    console.error('Error fetching carrier tracking:', error)
    throw error
  }
}

// Get tracking URL
export const getTrackingUrl = (carrier, trackingNumber) => {
  const carrierConfig = CARRIERS[carrier]
  if (carrierConfig?.trackingUrl && trackingNumber) {
    return carrierConfig.trackingUrl + trackingNumber
  }
  return null
}

// Subscribe to shipments
export const subscribeToShipments = (callback, filters = {}) => {
  let q = query(shipmentsCollection, orderBy('createdAt', 'desc'))

  if (filters.status) {
    q = query(q, where('status', '==', filters.status))
  }

  return onSnapshot(q, (snapshot) => {
    const shipments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(shipments)
  })
}

// Subscribe to user's shipments
export const subscribeToUserShipments = (userId, callback) => {
  // First get user's orders, then filter shipments
  const ordersQuery = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  )

  return onSnapshot(ordersQuery, async (ordersSnapshot) => {
    const shipmentIds = ordersSnapshot.docs
      .map(doc => doc.data().shipmentId)
      .filter(Boolean)

    if (shipmentIds.length === 0) {
      callback([])
      return
    }

    // Get all related shipments
    const shipments = await Promise.all(
      [...new Set(shipmentIds)].map(async (shipmentId) => {
        const shipmentDoc = await getDoc(doc(db, 'shipments', shipmentId))
        return { id: shipmentDoc.id, ...shipmentDoc.data() }
      })
    )

    callback(shipments.filter(s => s.id))
  })
}

// Update shipment status
export const updateShipmentStatus = async (shipmentId, status, description = '') => {
  try {
    const shipmentRef = doc(db, 'shipments', shipmentId)
    const shipmentDoc = await getDoc(shipmentRef)

    if (!shipmentDoc.exists()) {
      throw new Error('Shipment not found')
    }

    const currentHistory = shipmentDoc.data().trackingHistory || []

    await updateDoc(shipmentRef, {
      status,
      trackingHistory: [
        ...currentHistory,
        {
          status,
          timestamp: new Date(),
          description: description || `Status updated to ${status}`
        }
      ],
      [`${status}At`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update related orders if delivered
    if (status === 'delivered') {
      const orderIds = shipmentDoc.data().orderIds || []
      if (shipmentDoc.data().orderId) orderIds.push(shipmentDoc.data().orderId)

      await Promise.all(
        orderIds.map(orderId =>
          updateDoc(doc(db, 'orders', orderId), {
            status: 'delivered',
            deliveredAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        )
      )
    }
  } catch (error) {
    console.error('Error updating shipment status:', error)
    throw error
  }
}

// Calculate shipping cost estimate
export const estimateShippingCost = async (destination, items, aggregated = false) => {
  // Simplified shipping cost calculation
  // In production, this would use carrier APIs

  const baseRate = 5.99
  const perItemRate = 0.50
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  let cost = baseRate + (totalItems * perItemRate)

  // Discount for aggregated shipping
  if (aggregated) {
    cost *= 0.7 // 30% discount for aggregated
  }

  // Add zone-based pricing (simplified)
  const zoneMultipliers = {
    'domestic': 1,
    'eu': 1.5,
    'international': 2.5
  }

  const zone = destination.country === 'NL' ? 'domestic' :
    ['BE', 'DE', 'FR', 'GB', 'ES', 'IT'].includes(destination.country) ? 'eu' : 'international'

  cost *= zoneMultipliers[zone]

  return {
    cost: Math.round(cost * 100) / 100,
    zone,
    aggregatedDiscount: aggregated ? '30%' : null,
    estimatedDays: zone === 'domestic' ? '1-2' : zone === 'eu' ? '3-5' : '7-14'
  }
}

export { CARRIERS }
