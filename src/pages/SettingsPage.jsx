import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
]

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { language, changeLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      orders: true,
      marketing: false,
      priceAlerts: true
    },
    shipping: {
      defaultAddress: {
        street: '',
        city: '',
        postalCode: '',
        country: 'NL'
      },
      preferAggregated: true
    },
    display: {
      currency: 'USD',
      language: 'en',
      timezone: 'Europe/Amsterdam'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return
      try {
        const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid))
        if (settingsDoc.exists()) {
          setSettings(prev => ({ ...prev, ...settingsDoc.data() }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [user])

  const saveSettings = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'userSettings', user.uid), {
        ...settings,
        updatedAt: serverTimestamp()
      })
      setMessage({ type: 'success', textKey: 'settingsSaved' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', textKey: 'failedToSave' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const tabs = [
    { id: 'profile', labelKey: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'display', labelKey: 'display', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'notifications', labelKey: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'shipping', labelKey: 'shipping', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { id: 'integrations', labelKey: 'integrations', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
    { id: 'security', labelKey: 'security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings')}</h1>
        <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('notificationPreferences')}</p>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {t(message.textKey)}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600/20 text-primary-400'
                    : isDark
                      ? 'text-slate-400 hover:bg-surface-card hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200 shadow-sm'}`}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('profileInformation')}</h2>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl font-bold text-white">
                    {profile?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile?.fullName || 'User'}</div>
                    <div className={isDark ? 'text-slate-400' : 'text-gray-500'}>{user?.email}</div>
                    <div className="text-sm text-primary-400 capitalize mt-1">{profile?.role || 'stakeholder'}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('fullName')}</label>
                    <input
                      type="text"
                      defaultValue={profile?.fullName}
                      className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('email')}</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className={`w-full px-4 py-2.5 rounded-lg border opacity-50 ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                  <div className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('memberSince')}</div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.createdAt?.toDate
                      ? new Date(profile.createdAt.toDate()).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Display Tab */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('displaySettings')}</h2>

                {/* Theme Selection */}
                <div>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('theme')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => !isDark || toggleTheme()}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        !isDark
                          ? 'border-primary-500 bg-primary-500/10'
                          : isDark
                            ? 'border-surface-border hover:border-slate-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('light')}</div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('brightTheme')}</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => isDark || toggleTheme()}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isDark
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-surface-dark' : 'bg-gray-800'}`}>
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('dark')}</div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('easyOnEyes')}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('language')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          language === lang.code
                            ? 'border-primary-500 bg-primary-500/10'
                            : isDark
                              ? 'border-surface-border hover:border-slate-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{lang.flag}</div>
                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{lang.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Selection */}
                <div>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('currency')}</h3>
                  <select
                    value={settings.display.currency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, currency: e.target.value }
                    }))}
                    className={`w-full md:w-64 px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-surface-dark border-surface-border text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                {/* Timezone Selection */}
                <div>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('timezone')}</h3>
                  <select
                    value={settings.display.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, timezone: e.target.value }
                    }))}
                    className={`w-full md:w-64 px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-surface-dark border-surface-border text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('notificationPreferences')}</h2>

                <div className="space-y-4">
                  {[
                    { key: 'email', labelKey: 'emailNotifications', descKey: 'receiveNotifications' },
                    { key: 'push', labelKey: 'pushNotifications', descKey: 'browserNotifications' },
                    { key: 'orders', labelKey: 'orderUpdates', descKey: 'updatesOnOrders' },
                    { key: 'priceAlerts', labelKey: 'priceAlerts', descKey: 'alertsWhenPrices' },
                    { key: 'marketing', labelKey: 'marketingEmails', descKey: 'newsPromotions' }
                  ].map(item => (
                    <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t(item.labelKey)}</div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t(item.descKey)}</div>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [item.key]: !prev.notifications[item.key]
                          }
                        }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          settings.notifications[item.key] ? 'bg-accent-emerald' : 'bg-surface-border'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('shipping')}</h2>

                <div>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{t('defaultShippingAddress')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('streetAddress')}</label>
                      <input
                        type="text"
                        value={settings.shipping.defaultAddress.street}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shipping: {
                            ...prev.shipping,
                            defaultAddress: { ...prev.shipping.defaultAddress, street: e.target.value }
                          }
                        }))}
                        className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('city')}</label>
                      <input
                        type="text"
                        value={settings.shipping.defaultAddress.city}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shipping: {
                            ...prev.shipping,
                            defaultAddress: { ...prev.shipping.defaultAddress, city: e.target.value }
                          }
                        }))}
                        className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('postalCode')}</label>
                      <input
                        type="text"
                        value={settings.shipping.defaultAddress.postalCode}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shipping: {
                            ...prev.shipping,
                            defaultAddress: { ...prev.shipping.defaultAddress, postalCode: e.target.value }
                          }
                        }))}
                        className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('country')}</label>
                      <select
                        value={settings.shipping.defaultAddress.country}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shipping: {
                            ...prev.shipping,
                            defaultAddress: { ...prev.shipping.defaultAddress, country: e.target.value }
                          }
                        }))}
                        className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                      >
                        <option value="NL">Netherlands</option>
                        <option value="BE">Belgium</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('preferAggregatedShipping')}</div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('combineOrders')}</div>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, preferAggregated: !prev.shipping.preferAggregated }
                    }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      settings.shipping.preferAggregated ? 'bg-accent-emerald' : 'bg-surface-border'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.shipping.preferAggregated ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('connectedServices')}</h2>

                <div className="space-y-4">
                  {[
                    { name: 'Firebase', desc: 'Authentication & Database', connected: true, icon: '🔥' },
                    { name: 'AWS S3', desc: 'Asset Storage', connected: true, icon: '☁️' },
                    { name: 'Stripe', desc: 'Payment Processing', connected: false, icon: '💳' },
                    { name: 'UPS', desc: 'Shipping & Tracking', connected: false, icon: '📦' },
                    { name: 'FedEx', desc: 'Shipping & Tracking', connected: false, icon: '📦' }
                  ].map(service => (
                    <div key={service.name} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{service.icon}</div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{service.name}</div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{service.desc}</div>
                        </div>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          service.connected
                            ? 'bg-accent-emerald/20 text-accent-emerald'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {service.connected ? t('connected') : t('connect')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('securitySettings')}</h2>

                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('changePassword')}</div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('updatePassword')}</div>
                      </div>
                      <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isDark ? 'bg-surface-border hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        {t('change')}
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('twoFactorAuth')}</div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('addExtraSecurity')}</div>
                      </div>
                      <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium text-sm transition-colors text-white">
                        {t('enable')}
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('activeSessions')}</div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('manageDevices')}</div>
                      </div>
                      <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isDark ? 'bg-surface-border hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        {t('viewAll')}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-red-400">{t('deleteAccount')}</div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('permanentlyDelete')}</div>
                      </div>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm transition-colors text-white">
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className={`mt-8 pt-6 border-t flex justify-end ${isDark ? 'border-surface-border' : 'border-gray-200'}`}>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t('saving')}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
