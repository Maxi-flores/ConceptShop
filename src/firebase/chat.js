import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { db } from './config'

// Collections
const messagesCollection = collection(db, 'chatMessages')
const roomsCollection = collection(db, 'chatRooms')
const presenceCollection = collection(db, 'userPresence')

// Send message
export const sendMessage = async (roomId, userId, userName, content, type = 'text') => {
  try {
    const messageRef = await addDoc(messagesCollection, {
      roomId,
      userId,
      userName,
      content,
      type, // 'text', 'image', 'file', 'system'
      read: false,
      readBy: [userId],
      createdAt: serverTimestamp()
    })

    // Update room's last message
    await updateDoc(doc(db, 'chatRooms', roomId), {
      lastMessage: content,
      lastMessageAt: serverTimestamp(),
      lastMessageBy: userId
    })

    return messageRef.id
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Subscribe to room messages
export const subscribeToMessages = (roomId, callback, messageLimit = 100) => {
  const q = query(
    messagesCollection,
    where('roomId', '==', roomId),
    orderBy('createdAt', 'desc'),
    limit(messageLimit)
  )

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse()
    callback(messages)
  })
}

// Create chat room
export const createRoom = async (roomData) => {
  try {
    const roomRef = await addDoc(roomsCollection, {
      ...roomData,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp()
    })
    return roomRef.id
  } catch (error) {
    console.error('Error creating room:', error)
    throw error
  }
}

// Get or create general room
export const getOrCreateGeneralRoom = async () => {
  try {
    const q = query(roomsCollection, where('type', '==', 'general'))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    }

    // Create general room
    const roomId = await createRoom({
      name: 'General',
      type: 'general',
      description: 'General discussion for all stakeholders',
      isPublic: true,
      members: []
    })

    return { id: roomId, name: 'General', type: 'general' }
  } catch (error) {
    console.error('Error getting general room:', error)
    throw error
  }
}

// Subscribe to chat rooms
export const subscribeToRooms = (userId, callback) => {
  const q = query(roomsCollection, orderBy('lastMessageAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(room => room.isPublic || room.members?.includes(userId))
    callback(rooms)
  })
}

// Update user presence
export const updatePresence = async (userId, userName, status = 'online') => {
  try {
    await updateDoc(doc(db, 'userPresence', userId), {
      status,
      userName,
      lastSeen: serverTimestamp()
    }).catch(async () => {
      // Document doesn't exist, create it
      await addDoc(collection(db, 'userPresence'), {
        odanım: userId,
        status,
        userName,
        lastSeen: serverTimestamp()
      })
    })
  } catch (error) {
    console.error('Error updating presence:', error)
  }
}

// Set user presence document
export const setUserPresence = async (userId, userName, status = 'online') => {
  try {
    const presenceRef = doc(db, 'userPresence', userId)
    const presenceDoc = await getDoc(presenceRef)

    if (presenceDoc.exists()) {
      await updateDoc(presenceRef, {
        status,
        userName,
        lastSeen: serverTimestamp()
      })
    } else {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(presenceRef, {
        userId,
        status,
        userName,
        lastSeen: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error setting presence:', error)
  }
}

// Subscribe to online users
export const subscribeToOnlineUsers = (callback) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const q = query(
    presenceCollection,
    where('status', '==', 'online')
  )

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(users)
  })
}

// Mark messages as read
export const markMessagesAsRead = async (roomId, userId) => {
  try {
    const q = query(
      messagesCollection,
      where('roomId', '==', roomId),
      where('read', '==', false)
    )

    const snapshot = await getDocs(q)
    const batch = []

    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (!data.readBy?.includes(userId)) {
        batch.push(
          updateDoc(doc.ref, {
            readBy: [...(data.readBy || []), userId]
          })
        )
      }
    })

    await Promise.all(batch)
  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

// Delete message
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, 'chatMessages', messageId))
  } catch (error) {
    console.error('Error deleting message:', error)
    throw error
  }
}

// ========================================
// PRODUCT DISCUSSION ROOM FUNCTIONS
// ========================================

// Get or create a product discussion room
export const getOrCreateProductRoom = async (productId, productName) => {
  try {
    // Check if room already exists
    const q = query(
      roomsCollection,
      where('type', '==', 'product'),
      where('productId', '==', productId)
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    }

    // Create new product room
    const roomId = await createRoom({
      name: productName,
      type: 'product',
      productId: productId,
      description: `Discussion room for ${productName}`,
      isPublic: true,
      members: []
    })

    return {
      id: roomId,
      name: productName,
      type: 'product',
      productId: productId,
      description: `Discussion room for ${productName}`,
      isPublic: true
    }
  } catch (error) {
    console.error('Error getting/creating product room:', error)
    throw error
  }
}

// Subscribe to product room messages (with limit for inline panel)
export const subscribeToProductMessages = (productId, callback, messageLimit = 20) => {
  // First we need to get the room by productId
  const roomQuery = query(
    roomsCollection,
    where('type', '==', 'product'),
    where('productId', '==', productId)
  )

  return onSnapshot(roomQuery, async (roomSnapshot) => {
    if (roomSnapshot.empty) {
      callback([])
      return
    }

    const roomId = roomSnapshot.docs[0].id

    // Subscribe to messages for this room
    const messagesQuery = query(
      messagesCollection,
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    )

    onSnapshot(messagesQuery, (msgSnapshot) => {
      const messages = msgSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse()
      callback(messages)
    })
  })
}

// Send message to product discussion room
export const sendProductMessage = async (productId, productName, userId, userName, content) => {
  try {
    // Get or create the product room first
    const room = await getOrCreateProductRoom(productId, productName)

    // Send the message
    return await sendMessage(room.id, userId, userName, content)
  } catch (error) {
    console.error('Error sending product message:', error)
    throw error
  }
}

// Get all product discussion rooms
export const getProductRooms = async () => {
  try {
    const q = query(
      roomsCollection,
      where('type', '==', 'product'),
      orderBy('lastMessageAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting product rooms:', error)
    throw error
  }
}

// Subscribe to product discussion rooms
export const subscribeToProductRooms = (callback) => {
  const q = query(
    roomsCollection,
    where('type', '==', 'product'),
    orderBy('lastMessageAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(rooms)
  })
}
