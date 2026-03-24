import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import {
  subscribeToProductMessages,
  sendProductMessage,
  getOrCreateProductRoom
} from '../firebase/chat'

export default function ProductDiscussionPanel({
  productId,
  productName,
  isOpen,
  onClose,
  onOpenFullChat
}) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const { user, profile } = useAuth()
  const { onlineUsers } = useChat()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!productId || !isOpen) return

    setLoading(true)
    const unsubscribe = subscribeToProductMessages(productId, (msgs) => {
      setMessages(msgs)
      setLoading(false)
    }, 20)

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [productId, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !user || sending) return

    setSending(true)
    try {
      await sendProductMessage(
        productId,
        productName,
        user.uid,
        profile?.displayName || user.email?.split('@')[0] || 'User',
        input.trim()
      )
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleOpenFullChat = async () => {
    try {
      const room = await getOrCreateProductRoom(productId, productName)
      onOpenFullChat?.(room)
    } catch (error) {
      console.error('Failed to open full chat:', error)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`mt-4 rounded-xl overflow-hidden border ${
        isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDark ? 'bg-surface-dark border-surface-border' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-primary-600/20' : 'bg-primary-100'}`}>
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-sm">{t('productDiscussion')}: {productName}</h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {messages.length} {t('recentMessages')} | {onlineUsers.length + 1} {t('online')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFullChat}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDark
                ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            {t('joinDiscussion')}
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-surface-border' : 'hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-48 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">{t('noDiscussionsYet')}</p>
            <p className="text-xs mt-1">{t('startDiscussion')}</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.userId === user?.uid
            const showName = i === 0 || messages[i - 1]?.userId !== msg.userId

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                  {showName && !isOwn && (
                    <span className={`text-xs mb-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {msg.userName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm ${
                      isOwn
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : isDark
                          ? 'bg-surface-dark rounded-bl-sm'
                          : 'bg-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className={`text-xs mt-0.5 block ${isOwn ? 'text-right' : ''} ${
                    isDark ? 'text-slate-500' : 'text-gray-400'
                  }`}>
                    {msg.createdAt?.toDate
                      ? format(msg.createdAt.toDate(), 'HH:mm')
                      : ''
                    }
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
        className={`p-3 border-t ${isDark ? 'border-surface-border' : 'border-gray-200'}`}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('typeMessage')}
            disabled={!user || sending}
            className={`flex-1 px-3 py-2 rounded-lg text-sm ${
              isDark
                ? 'bg-surface-dark border-surface-border text-white placeholder-slate-500'
                : 'bg-gray-50 border-gray-200 placeholder-gray-400'
            } border focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={!input.trim() || !user || sending}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              t('send')
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
