import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import {
  subscribeToCampaigns,
  createCampaign,
  updateCampaignStatus,
  calculateROI,
  getMarketingOverview,
  generateTrackingUrl,
  createReferralLink
} from '../services/marketing'
import { useAuth } from '../context/AuthContext'

export default function MarketingPage() {
  const { user, isAdmin } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToCampaigns((data) => {
      setCampaigns(data)
      setLoading(false)
    })

    // Get overview for last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    getMarketingOverview(startDate, endDate).then(setOverview).catch(console.error)

    return () => unsubscribe()
  }, [])

  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.metrics?.revenue || 0), 0)
  const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0

  // Sample performance data
  const performanceData = [
    { date: 'Mon', impressions: 12400, clicks: 840, conversions: 42 },
    { date: 'Tue', impressions: 15800, clicks: 1020, conversions: 51 },
    { date: 'Wed', impressions: 18200, clicks: 1180, conversions: 58 },
    { date: 'Thu', impressions: 14500, clicks: 920, conversions: 45 },
    { date: 'Fri', impressions: 21000, clicks: 1450, conversions: 72 },
    { date: 'Sat', impressions: 16800, clicks: 1100, conversions: 55 },
    { date: 'Sun', impressions: 13200, clicks: 780, conversions: 38 }
  ]

  const channelData = [
    { channel: 'Email', impressions: 45000, conversions: 180, revenue: 8500 },
    { channel: 'Social', impressions: 82000, conversions: 95, revenue: 4200 },
    { channel: 'Referral', impressions: 12000, conversions: 85, revenue: 6800 },
    { channel: 'Direct', impressions: 28000, conversions: 120, revenue: 5400 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing Analytics</h1>
          <p className="text-slate-400">Track campaigns and measure ROI</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Campaign
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Campaigns</p>
              <p className="text-3xl font-bold mt-1">{activeCampaigns.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Spend</p>
              <p className="text-3xl font-bold mt-1">${totalSpend.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-coral/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold mt-1 text-accent-emerald">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-emerald/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Overall ROI</p>
              <p className={`text-3xl font-bold mt-1 ${overallROI >= 0 ? 'text-accent-emerald' : 'text-red-400'}`}>
                {overallROI.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'campaigns', label: 'Campaigns' },
          { id: 'channels', label: 'Channels' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Performance Chart */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
            <h2 className="text-lg font-semibold mb-4">Weekly Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="impressions" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorImpressions)" />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Performance */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
            <h2 className="text-lg font-semibold mb-4">Channel Performance</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="channel" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" fill="#f5c518" name="Revenue ($)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
              <p className="text-lg">No campaigns yet</p>
              <p className="text-sm mt-1">Create your first campaign to start tracking</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {campaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={() => setSelectedCampaign(campaign)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="grid md:grid-cols-2 gap-6">
          {channelData.map(channel => (
            <div key={channel.channel} className="p-6 rounded-xl bg-surface-card border border-surface-border">
              <h3 className="text-lg font-semibold mb-4">{channel.channel}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Impressions</div>
                  <div className="text-xl font-bold">{channel.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Conversions</div>
                  <div className="text-xl font-bold text-accent-emerald">{channel.conversions}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Revenue</div>
                  <div className="text-xl font-bold text-accent-gold">${channel.revenue.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-border">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Conversion Rate</span>
                  <span className="font-medium">
                    {(channel.conversions / channel.impressions * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              await createCampaign(data)
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CampaignCard({ campaign, onSelect, isAdmin }) {
  const metrics = campaign.metrics || {}
  const roi = metrics.spend > 0 ? ((metrics.revenue - metrics.spend) / metrics.spend * 100) : 0
  const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions * 100) : 0

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    active: 'bg-accent-emerald/20 text-accent-emerald',
    paused: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-blue-500/20 text-blue-400'
  }

  return (
    <div className="p-6 bg-surface-card border border-surface-border rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
            <span className="text-sm text-slate-400">{campaign.type}</span>
          </div>
          <h3 className="text-lg font-semibold">{campaign.name}</h3>
          <p className="text-sm text-slate-400 mt-1">{campaign.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-400">Impressions</div>
            <div className="text-lg font-semibold">{metrics.impressions?.toLocaleString() || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">CTR</div>
            <div className="text-lg font-semibold">{ctr.toFixed(2)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">Conversions</div>
            <div className="text-lg font-semibold text-accent-emerald">{metrics.conversions || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">ROI</div>
            <div className={`text-lg font-semibold ${roi >= 0 ? 'text-accent-emerald' : 'text-red-400'}`}>
              {roi.toFixed(1)}%
            </div>
          </div>
        </div>

        <button
          onClick={onSelect}
          className="px-4 py-2 bg-surface-dark hover:bg-surface-border rounded-lg transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

function CreateCampaignModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    budget: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onCreate({
      ...formData,
      budget: parseFloat(formData.budget)
    })
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Create Campaign</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
              >
                <option value="email">Email</option>
                <option value="social">Social Media</option>
                <option value="referral">Referral</option>
                <option value="paid">Paid Ads</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Budget ($)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                min="0"
                step="100"
                className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-dark hover:bg-surface-border rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
