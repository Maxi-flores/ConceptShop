import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useStakeholder } from '../context/StakeholderContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { subscribeToGroupOrders } from '../firebase/orders'
import { subscribeToCampaigns, getMarketingOverview } from '../services/marketing'
import { getUserDisplayName } from '../utils/profile'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const { myStake, totalPool, stakeholders, getTopStakeholders } = useStakeholder()
  const { t } = useLanguage()
  const { isDark } = useTheme()
  const [groupOrders, setGroupOrders] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [marketingOverview, setMarketingOverview] = useState(null)

  useEffect(() => {
    const unsubOrders = subscribeToGroupOrders((orders) => {
      setGroupOrders(orders.filter(o => o.status === 'open').slice(0, 5))
    }, 'open')

    const unsubCampaigns = subscribeToCampaigns((camps) => {
      setCampaigns(camps.filter(c => c.status === 'active').slice(0, 3))
    })

    // Get marketing overview for last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    getMarketingOverview(startDate, endDate).then(setMarketingOverview).catch(console.error)

    return () => {
      unsubOrders()
      unsubCampaigns()
    }
  }, [])

  const topStakeholders = getTopStakeholders(5)

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12400, orders: 45 },
    { month: 'Feb', revenue: 15800, orders: 52 },
    { month: 'Mar', revenue: 18200, orders: 61 },
    { month: 'Apr', revenue: 21500, orders: 73 },
    { month: 'May', revenue: 19800, orders: 68 },
    { month: 'Jun', revenue: 24100, orders: 82 }
  ]

  const shareDistribution = [
    { tier: 'Platinum', count: 12, shares: 45000 },
    { tier: 'Gold', count: 34, shares: 28000 },
    { tier: 'Silver', count: 89, shares: 18000 },
    { tier: 'Bronze', count: 156, shares: 9000 }
  ]

  const tierColors = {
    platinum: 'text-slate-300',
    gold: 'text-accent-gold',
    silver: 'text-slate-400',
    bronze: 'text-amber-700'
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('welcomeBack')}, {getUserDisplayName(profile, user).split(' ')[0] || 'ConceptSHOP'}</h1>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('heresWhatsHappening')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('joinGroupOrder')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('yourShares')}</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{myStake?.totalShares || 0}</p>
              <p className="text-sm text-primary-400 mt-1">
                {totalPool.totalShares > 0
                  ? `${((myStake?.totalShares || 0) / totalPool.totalShares * 100).toFixed(2)}% ${t('ownership')}`
                  : `0% ${t('ownership')}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-accent-gold/20 to-amber-800/20 border border-accent-gold/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('yourTier')}</p>
              <p className={`text-3xl font-bold mt-1 capitalize ${tierColors[myStake?.tier || 'bronze']}`}>
                {t(myStake?.tier || 'bronze')}
              </p>
              <p className="text-sm text-accent-gold mt-1">
                ${(myStake?.investmentAmount || 0).toLocaleString()} {t('invested')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-gradient-to-br from-accent-emerald/20 to-emerald-800/20 border border-accent-emerald/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('totalPool')}</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>${totalPool.totalInvestment.toLocaleString()}</p>
              <p className="text-sm text-accent-emerald mt-1">
                {totalPool.activeStakeholders} {t('activeStakeholders')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-emerald/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('orderContribution')}</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>${(myStake?.orderContribution || 0).toLocaleString()}</p>
              <p className="text-sm text-purple-400 mt-1">
                {myStake?.totalShares > 0
                  ? `${Math.floor((myStake?.orderContribution || 0) / 500)} ${t('participationShares')}`
                  : `0 ${t('participationShares')}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('poolRevenue')}</h2>
            <select className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? 'bg-surface-dark border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
              <option>{t('lastMonths').replace('{count}', '6')}</option>
              <option>{t('lastYear')}</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share Distribution */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('shareDistributionByTier')}</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shareDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="tier" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="shares" fill="#f5c518" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Group Orders */}
        <div className={`lg:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('activeGroupOrders')}</h2>
            <Link to="/orders" className="text-sm text-primary-400 hover:text-primary-300">
              {t('viewAll')}
            </Link>
          </div>
          {groupOrders.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>{t('noActiveGroupOrders')}</p>
              <Link to="/orders" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                {t('createOne')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {groupOrders.map(order => (
                <div key={order.id} className={`p-4 rounded-lg flex items-center justify-between ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.products?.[0]?.productName || t('groupOrder')}</div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {order.participants?.length || 0} {t('participants')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-accent-emerald font-medium">
                      {order.products?.[0]?.currentQuantity || 0} / {order.products?.[0]?.targetQuantity || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {Math.round((order.products?.[0]?.currentQuantity / order.products?.[0]?.targetQuantity) * 100 || 0)}% {t('complete')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Stakeholders */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('topStakeholders')}</h2>
            <Link to="/stakeholders" className="text-sm text-primary-400 hover:text-primary-300">
              {t('viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {topStakeholders.map((stakeholder, i) => (
              <div key={stakeholder.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-accent-gold/20 text-accent-gold' :
                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                  i === 2 ? 'bg-amber-700/20 text-amber-600' :
                  isDark ? 'bg-surface-border text-slate-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{stakeholder.fullName}</div>
                  <div className={`text-sm capitalize ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t(stakeholder.tier)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stakeholder.totalShares}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('shares')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
