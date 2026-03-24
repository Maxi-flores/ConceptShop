import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useStakeholder } from '../context/StakeholderContext'

export default function ProductInvestmentTracker({ productId, compact = false }) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const { getProductStats, totalPool } = useStakeholder()

  const stats = getProductStats(productId)
  const {
    stakeholderCount = 0,
    totalStakeholders = 0,
    participationRate = 0,
    totalAllocatedAmount = 0,
    totalPoolAmount = 0,
    allocationRate = 0
  } = stats

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Mini participation indicator */}
        <div className="relative group">
          <div className="flex items-center gap-1">
            <div className={`w-8 h-2 rounded-full overflow-hidden ${isDark ? 'bg-surface-dark' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${participationRate}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-primary-500 rounded-full"
              />
            </div>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {stakeholderCount}/{totalStakeholders}
            </span>
          </div>

          {/* Tooltip */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
            isDark ? 'bg-surface-card border border-surface-border' : 'bg-white shadow-lg border border-gray-200'
          }`}>
            <div className="font-medium mb-1">{t('stakeholderParticipation')}</div>
            <div>{stakeholderCount} {t('ofStakeholders')} {totalStakeholders}</div>
            <div className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {participationRate.toFixed(1)}% {t('participationRate')}
            </div>
          </div>
        </div>

        {/* Mini allocation indicator */}
        <div className="relative group">
          <div className="flex items-center gap-1">
            <div className={`w-8 h-2 rounded-full overflow-hidden ${isDark ? 'bg-surface-dark' : 'bg-gray-200'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(allocationRate, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {allocationRate.toFixed(0)}%
            </span>
          </div>

          {/* Tooltip */}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
            isDark ? 'bg-surface-card border border-surface-border' : 'bg-white shadow-lg border border-gray-200'
          }`}>
            <div className="font-medium mb-1">{t('investmentAllocation')}</div>
            <div>${totalAllocatedAmount.toLocaleString()} / ${totalPoolAmount.toLocaleString()}</div>
            <div className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {allocationRate.toFixed(1)}% {t('allocated')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
      <h4 className="font-semibold mb-4">{t('investmentAllocation')}</h4>

      {/* Stakeholder Participation */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {t('stakeholderParticipation')}
          </span>
          <span className="text-sm font-medium">
            {stakeholderCount} / {totalStakeholders}
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-surface-card' : 'bg-gray-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${participationRate}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
          />
        </div>
        <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {participationRate.toFixed(1)}% {t('ofStakeholders')}
        </div>
      </div>

      {/* Investment Allocation */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {t('allocatedAmount')}
          </span>
          <span className="text-sm font-medium">
            ${totalAllocatedAmount.toLocaleString()}
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-surface-card' : 'bg-gray-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(allocationRate, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          />
        </div>
        <div className={`flex items-center justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          <span>{allocationRate.toFixed(1)}% {t('allocated')}</span>
          <span>{t('total')}: ${totalPoolAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
