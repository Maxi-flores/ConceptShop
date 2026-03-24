import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useStakeholder } from '../context/StakeholderContext'

export default function ProductAllocationSlider({
  productId,
  compact = false,
  showQuickButtons = true,
  onAllocationChange
}) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const { getMyAllocation, setProductAllocation, myStake } = useStakeholder()

  const currentAllocation = getMyAllocation(productId)
  const [localValue, setLocalValue] = useState(currentAllocation)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalValue(currentAllocation)
  }, [currentAllocation])

  const handleSave = async (value) => {
    if (value === currentAllocation) return

    setSaving(true)
    try {
      await setProductAllocation(productId, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onAllocationChange?.(value)
    } catch (error) {
      console.error('Failed to save allocation:', error)
    } finally {
      setSaving(false)
    }
  }

  const quickButtons = [0, 25, 50, 100]

  const myInvestment = myStake?.investmentAmount || 0
  const allocatedAmount = (myInvestment * localValue) / 100

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative group">
          <input
            type="range"
            min="0"
            max="100"
            value={localValue}
            onChange={(e) => setLocalValue(parseInt(e.target.value))}
            onMouseUp={() => handleSave(localValue)}
            onTouchEnd={() => handleSave(localValue)}
            className="w-20 h-1.5 rounded-full appearance-none cursor-pointer accent-primary-500"
            style={{
              background: isDark
                ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localValue}%, #334155 ${localValue}%, #334155 100%)`
                : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localValue}%, #e5e7eb ${localValue}%, #e5e7eb 100%)`
            }}
          />
          <span className={`ml-2 text-xs font-medium min-w-[36px] ${
            localValue === 0 ? 'text-slate-500' : isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {localValue === 0 ? t('optedOut') : `${localValue}%`}
          </span>
          {saving && (
            <span className="ml-1 text-xs text-primary-500">{t('saving')}</span>
          )}
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="ml-1 text-xs text-emerald-500"
            >
              {t('saved')}
            </motion.span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{t('myAllocation')}</h4>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-primary-500">{t('saving')}</span>
          )}
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-emerald-500 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('allocationSaved')}
            </motion.span>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max="100"
          value={localValue}
          onChange={(e) => setLocalValue(parseInt(e.target.value))}
          onMouseUp={() => handleSave(localValue)}
          onTouchEnd={() => handleSave(localValue)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: isDark
              ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localValue}%, #334155 ${localValue}%, #334155 100%)`
              : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localValue}%, #e5e7eb ${localValue}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-medium ${
            localValue === 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {localValue === 0 ? t('optedOut') : `${localValue}%`}
          </span>
          {myInvestment > 0 && (
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              ${allocatedAmount.toLocaleString()} {t('allocated')}
            </span>
          )}
        </div>
      </div>

      {/* Quick Buttons */}
      {showQuickButtons && (
        <div className="flex gap-2">
          {quickButtons.map((value) => (
            <button
              key={value}
              onClick={() => {
                setLocalValue(value)
                handleSave(value)
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
                localValue === value
                  ? 'bg-primary-600 text-white'
                  : isDark
                    ? 'bg-surface-card hover:bg-surface-border text-slate-300'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {value === 0 ? t('optedOut') : `${value}%`}
            </button>
          ))}
        </div>
      )}

      {/* Info text */}
      {localValue === 0 && (
        <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {t('optedOutDescription')}
        </p>
      )}
    </div>
  )
}
