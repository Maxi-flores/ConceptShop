import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  subscribeToMessages,
  subscribeToRooms,
  subscribeToOnlineUsers,
  sendMessage as sendChatMessage,
  getOrCreateGeneralRoom,
  setUserPresence,
  markMessagesAsRead
} from '../firebase/chat'
import { useAuth } from './AuthContext'
import { getUserDisplayName, normalizeUserProfile } from '../utils/profile'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user, profile } = useAuth()
  const safeProfile = useMemo(() => normalizeUserProfile(profile), [profile])
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Subscribe to rooms
  useEffect(() => {
    if (!user) {
      setRooms([])
      setCurrentRoom(null)
      setMessages([])
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToRooms(user.uid, (roomData) => {
      setRooms(roomData)
      if (!currentRoom && roomData.length > 0) {
        // Auto-select general room or first room
        const generalRoom = roomData.find(r => r.type === 'general')
        setCurrentRoom(generalRoom || roomData[0])
      }
      setLoading(false)
    })

    // Initialize general room
    getOrCreateGeneralRoom().catch(console.error)

    return () => unsubscribe()
  }, [user])

  // Subscribe to current room messages
  useEffect(() => {
    if (!currentRoom) {
      setMessages([])
      return
    }

    const unsubscribe = subscribeToMessages(currentRoom.id, (messageData) => {
      setMessages(messageData)
    })

    // Mark messages as read
    if (user) {
      markMessagesAsRead(currentRoom.id, user.uid)
    }

    return () => unsubscribe()
  }, [currentRoom, user])

  // Subscribe to online users
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToOnlineUsers((users) => {
      setOnlineUsers(users.filter(u => u.userId !== user.uid))
    })

    // Set current user as online
    setUserPresence(user.uid, getUserDisplayName(safeProfile, user), 'online')

    // Set offline on unmount
    return () => {
      setUserPresence(user.uid, getUserDisplayName(safeProfile, user), 'offline')
      unsubscribe()
    }
  }, [user, safeProfile])

  // Send message
  const sendMessage = useCallback(async (content, type = 'text') => {
    if (!user || !currentRoom || !content.trim()) return

    try {
      await sendChatMessage(
        currentRoom.id,
        user.uid,
        getUserDisplayName(safeProfile, user),
        content,
        type
      )
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [user, safeProfile, currentRoom])

  // Select room
  const selectRoom = useCallback((room) => {
    setCurrentRoom(room)
    if (user) {
      markMessagesAsRead(room.id, user.uid)
    }
  }, [user])

  // Toggle chat
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])

  const value = {
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    unreadCounts,
    isOpen,
    loading,
    sendMessage,
    selectRoom,
    toggleChat,
    openChat,
    closeChat
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
