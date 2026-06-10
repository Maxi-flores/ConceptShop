import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useStakeholder } from '../../context/StakeholderContext'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { NAV_ITEMS, LANGUAGES } from '../../constants/navigation'
import IdentityBadge from '../account/IdentityBadge'

export default function TopBar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, profile, user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { totalPool } = useStakeholder()
  const { isDark, toggleTheme } = useTheme()
  const { language, changeLanguage, t } = useLanguage()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <header
        className={`h-16 border-b flex items-center justify-between px-6 ${
          isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(NAV_ITEMS.find((item) => item.path === location.pathname)?.labelKey || 'dashboard')}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden xl:block">
            <IdentityBadge profile={profile} user={user} compact showEmail />
          </div>

          {/* Pool Stats */}
          <div
            className={`hidden md:flex items-center gap-4 px-4 py-1.5 rounded-lg border ${
              isDark ? 'bg-surface-card border-surface-border' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="text-center">
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Pool</div>
              <div className="text-sm font-semibold text-accent-emerald">
                ${totalPool.totalInvestment.toLocaleString()}
              </div>
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">{LANGUAGES.find((l) => l.code === language)?.flag || 'EN'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langMenuOpen && (
              <div
                className={`absolute right-0 top-10 w-40 rounded-lg shadow-xl z-50 border overflow-hidden ${
                  isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'
                }`}
              >
                {LANGUAGES.map((lang) => (
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div
                className={`absolute right-0 top-12 w-80 rounded-xl shadow-xl z-50 border ${
                  isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'
                }`}
              >
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    isDark ? 'border-surface-border' : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary-400 hover:text-primary-300">
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
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3 border-b cursor-pointer ${
                          isDark ? 'border-surface-border hover:bg-surface-card' : 'border-gray-100 hover:bg-gray-50'
                        } ${!notif.read ? 'bg-primary-500/5' : ''}`}
                      >
                        <div className="text-sm">{notif.title}</div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {notif.message}
                        </div>
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
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-surface-card text-slate-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

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
    </>
  )
}
