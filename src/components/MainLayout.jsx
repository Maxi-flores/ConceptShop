import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useStakeholder } from '../context/StakeholderContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
  { path: '/dashboard', labelKey: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/products', labelKey: 'products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/orders', labelKey: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { path: '/stakeholders', labelKey: 'stakeholders', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/marketing', labelKey: 'marketing', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
  { path: '/forecasting', labelKey: 'forecasting', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { path: '/shipping', labelKey: 'shipping', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { path: '/stock', labelKey: 'stock', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { path: '/settings', labelKey: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
]

const languages = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'nl', label: 'Nederlands', flag: 'NL' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'es', label: 'Español', flag: 'ES' }
]

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { myStake, totalPool } = useStakeholder()
  const { isDark, toggleTheme } = useTheme()
  const { language, changeLanguage, t } = useLanguage()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-surface-darker' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="text-lg font-semibold gradient-text">ConceptSHOP</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* Stake Summary (collapsed) */}
        {myStake && (
          <div className={`mx-3 mt-4 p-3 rounded-lg bg-gradient-to-r from-accent-gold/10 to-accent-emerald/10 border border-accent-gold/20 ${!sidebarOpen && 'mx-2 p-2'}`}>
            {sidebarOpen ? (
              <>
                <div className="text-xs text-slate-400 mb-1">Your Stake</div>
                <div className="text-lg font-semibold text-accent-gold">{myStake.totalShares} shares</div>
                <div className="text-xs text-slate-400 mt-1">
                  {totalPool.totalShares > 0 ? ((myStake.totalShares / totalPool.totalShares) * 100).toFixed(2) : 0}% ownership
                </div>
              </>
            ) : (
              <div className="text-center text-accent-gold font-semibold text-sm">{myStake.totalShares}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border-l-2 border-primary-400'
                    : isDark
                      ? 'text-slate-400 hover:bg-surface-card hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {sidebarOpen && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className={`p-3 border-t ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile?.fullName || 'User'}</div>
                <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{profile?.role || 'stakeholder'}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-6 ${isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t(navItems.find(item => item.path === location.pathname)?.labelKey || 'dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Pool Stats */}
            <div className={`hidden md:flex items-center gap-4 px-4 py-1.5 rounded-lg border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-center">
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Pool</div>
                <div className="text-sm font-semibold text-accent-emerald">${totalPool.totalInvestment.toLocaleString()}</div>
              </div>
              <div className={`w-px h-8 ${isDark ? 'bg-surface-border' : 'bg-gray-300'}`}></div>
              <div className="text-center">
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Stakeholders</div>
                <div className="text-sm font-semibold text-primary-400">{totalPool.activeStakeholders}</div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'}`}
              >
                <span className="text-sm font-medium">{languages.find(l => l.code === language)?.flag || 'EN'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langMenuOpen && (
                <div className={`absolute right-0 top-10 w-40 rounded-lg shadow-xl z-50 border overflow-hidden ${isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'}`}>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code)
                        setLangMenuOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        language === lang.code
                          ? 'bg-primary-600/20 text-primary-400'
                          : isDark
                            ? 'hover:bg-surface-card'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'}`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className={`absolute right-0 top-12 w-80 rounded-xl shadow-xl z-50 border ${isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'}`}>
                  <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
                    <span className="font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary-400 hover:text-primary-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className={`p-4 text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 border-b cursor-pointer ${
                            isDark ? 'border-surface-border hover:bg-surface-card' : 'border-gray-100 hover:bg-gray-50'
                          } ${!notif.read ? 'bg-primary-500/5' : ''}`}
                        >
                          <div className="text-sm">{notif.title}</div>
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{notif.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-surface-card text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(notificationsOpen || langMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setNotificationsOpen(false)
            setLangMenuOpen(false)
          }}
        />
      )}
    </div>
  )
}
