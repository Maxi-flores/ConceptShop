import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import Sidebar from './layout/Sidebar'
import TopBar from './layout/TopBar'
import { useAuth } from '../context/AuthContext'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isDark } = useTheme()
  const { profile } = useAuth()
  const billingPending = profile?.billingStatus === 'pending_payment'

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-surface-darker' : 'bg-gray-50'}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className={`relative flex-1 overflow-y-auto p-6 ${billingPending ? 'pointer-events-none opacity-50' : ''}`}>
          {children}
          {billingPending && (
            <div className="pointer-events-auto absolute inset-6 rounded-2xl border border-accent-gold/20 bg-surface-darker/95 backdrop-blur-md flex items-center justify-center p-6">
              <div className="max-w-lg text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gold/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86l-7.42 12.85A2 2 0 004.59 20h14.82a2 2 0 001.72-3.29L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment pending</h2>
                <p className="text-slate-300 mb-4">
                  Payment integration coming next. Continue in pending_payment mode.
                </p>
                <p className="text-sm text-slate-400">
                  Your account is active, but dashboard and team-member features are locked until billing is connected.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
