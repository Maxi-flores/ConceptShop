import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addNotification = async (notification) => {
    if (!user) return

    await addDoc(collection(db, 'notifications'), {
      userId: user.uid,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    })
  }

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    })
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read)
    await Promise.all(
      unread.map(n =>
        updateDoc(doc(db, 'notifications', n.id), {
          read: true,
          readAt: serverTimestamp()
        })
      )
    )
  }

  const deleteNotification = async (notificationId) => {
    await deleteDoc(doc(db, 'notifications', notificationId))
  }

  const clearAll = async () => {
    await Promise.all(
      notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)))
    )
  }

  // Send notification to specific user
  const notifyUser = async (userId, notification) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    })
  }

  // Send notification to all stakeholders
  const notifyAllStakeholders = async (notification) => {
    // This would typically be done via a Cloud Function
    // For now, we'll just log it
    console.log('Broadcasting notification:', notification)
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notifyUser,
    notifyAllStakeholders
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
