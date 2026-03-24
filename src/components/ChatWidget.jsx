import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

export default function ChatWidget() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const {
    rooms,
    currentRoom,
    messages,
    onlineUsers,
    isOpen,
    loading,
    sendMessage,
    selectRoom,
    toggleChat,
    closeChat
  } = useChat()

  const [input, setInput] = useState('')
  const [showRooms, setShowRooms] = useState(false)
  const [roomCategory, setRoomCategory] = useState('all')
  const messagesEndRef = useRef(null)

  // Categorize rooms
  const generalRooms = rooms.filter(r => r.type !== 'product')
  const productRooms = rooms.filter(r => r.type === 'product')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    try {
      await sendMessage(input)
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!user) return null

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 ${
          isDark
            ? 'bg-primary-600 hover:bg-primary-700'
            : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && onlineUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-emerald text-white text-xs rounded-full flex items-center justify-center">
            {onlineUsers.length}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-6 w-96 h-[500px] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden ${
              isDark
                ? 'bg-surface-card border border-surface-border'
                : 'bg-white border border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-surface-border bg-surface-dark' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRooms(!showRooms)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-surface-border' : 'hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                <div>
                  <h3 className="font-semibold">{currentRoom?.name || 'Chat'}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {onlineUsers.length + 1} online
                  </p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-surface-border' : 'hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Room Selector */}
            <AnimatePresence>
              {showRooms && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`border-b overflow-hidden ${
                    isDark ? 'border-surface-border bg-surface-darker' : 'border-gray-200 bg-gray-100'
                  }`}
                >
                  {/* Category Tabs */}
                  <div className={`flex border-b ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setRoomCategory('all')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        roomCategory === 'all'
                          ? isDark ? 'text-primary-400 border-b-2 border-primary-400' : 'text-primary-600 border-b-2 border-primary-600'
                          : isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {t('all')}
                    </button>
                    <button
                      onClick={() => setRoomCategory('general')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        roomCategory === 'general'
                          ? isDark ? 'text-primary-400 border-b-2 border-primary-400' : 'text-primary-600 border-b-2 border-primary-600'
                          : isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {t('chat')}
                    </button>
                    <button
                      onClick={() => setRoomCategory('products')}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        roomCategory === 'products'
                          ? isDark ? 'text-primary-400 border-b-2 border-primary-400' : 'text-primary-600 border-b-2 border-primary-600'
                          : isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {t('products')} {productRooms.length > 0 && `(${productRooms.length})`}
                    </button>
                  </div>

                  <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                    {/* General Rooms */}
                    {(roomCategory === 'all' || roomCategory === 'general') && generalRooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => {
                          selectRoom(room)
                          setShowRooms(false)
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                          currentRoom?.id === room.id
                            ? isDark ? 'bg-primary-600/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                            : isDark ? 'hover:bg-surface-card' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{room.name}</div>
                            {room.lastMessage && (
                              <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {room.lastMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Product Rooms */}
                    {(roomCategory === 'all' || roomCategory === 'products') && productRooms.length > 0 && (
                      <>
                        {roomCategory === 'all' && generalRooms.length > 0 && (
                          <div className={`px-3 py-1 text-xs font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            {t('productDiscussion')}
                          </div>
                        )}
                        {productRooms.map(room => (
                          <button
                            key={room.id}
                            onClick={() => {
                              selectRoom(room)
                              setShowRooms(false)
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                              currentRoom?.id === room.id
                                ? isDark ? 'bg-primary-600/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                                : isDark ? 'hover:bg-surface-card' : 'hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{room.name}</div>
                                {room.lastMessage && (
                                  <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {room.lastMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* No rooms message */}
                    {roomCategory === 'products' && productRooms.length === 0 && (
                      <div className={`py-4 text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {t('noDiscussionsYet')}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.userId === user.uid
                  const showAvatar = i === 0 || messages[i - 1]?.userId !== msg.userId

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                        {showAvatar && !isOwn && (
                          <span className={`text-xs mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {msg.userName}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : isDark
                                ? 'bg-surface-dark text-white rounded-bl-sm'
                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <span className={`text-xs mt-1 block ${isOwn ? 'text-right' : ''} ${
                          isDark ? 'text-slate-500' : 'text-gray-400'
                        }`}>
                          {msg.createdAt?.toDate
                            ? format(msg.createdAt.toDate(), 'HH:mm')
                            : ''}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className={`p-4 border-t ${isDark ? 'border-surface-border' : 'border-gray-200'}`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 px-4 py-2 rounded-full text-sm ${
                    isDark
                      ? 'bg-surface-dark border-surface-border text-white placeholder-slate-500'
                      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
