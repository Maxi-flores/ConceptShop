import { Link, useLocation } from 'react-router-dom'
import { useStakeholder } from '../../context/StakeholderContext'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { NAV_ITEMS } from '../../constants/navigation'

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation()
  const { myStake, totalPool } = useStakeholder()
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const { user, profile, isAdmin } = useAuth()

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-20'} ${
        isDark ? 'bg-surface-dark border-surface-border' : 'bg-white border-gray-200'
      } border-r transition-all duration-300 flex flex-col`}
    >
      {/* Logo */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b ${
          isDark ? 'border-surface-border' : 'border-gray-200'
        }`}
      >
        {isOpen && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="text-lg font-semibold gradient-text">ConceptSHOP</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-surface-card' : 'hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'}
            />
          </svg>
        </button>
      </div>

      {/* Stake Summary */}
      {myStake && (
        <div
          className={`mx-3 mt-4 p-3 rounded-lg bg-gradient-to-r from-accent-gold/10 to-accent-emerald/10 border border-accent-gold/20 ${
            !isOpen && 'mx-2 p-2'
          }`}
        >
          {isOpen ? (
            <>
              <div className="text-xs text-slate-400 mb-1">Your Stake</div>
              <div className="text-lg font-semibold text-accent-gold">{myStake.totalShares} shares</div>
              <div className="text-xs text-slate-400 mt-1">
                {totalPool.totalShares > 0
                  ? ((myStake.totalShares / totalPool.totalShares) * 100).toFixed(2)
                  : 0}
                % ownership
              </div>
            </>
          ) : (
            <div className="text-center text-accent-gold font-semibold text-sm">{myStake.totalShares}</div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) {
            return null
          }

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
              } ${!isOpen && 'justify-center'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {isOpen && <span className="text-sm font-medium">{t(item.labelKey)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className={`p-3 border-t ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">
              {profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.fullName || 'User'}
              </div>
              <div className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {profile?.role || 'stakeholder'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
