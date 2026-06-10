import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useStakeholder } from '../context/StakeholderContext'
import { createInviteCode } from '../firebase/auth'

export default function StakeholdersPage() {
  const { user, profile, isAdmin } = useAuth()
  const { stakeholders, myStake, totalPool, addInvestment, calculateSharePercentage } = useStakeholder()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [inviteError, setInviteError] = useState('')
  const subMemberCount = stakeholders.filter(s => s.invitedBy === user?.uid).length
  const billingPending = profile?.billingStatus === 'pending_payment'
  const canCreateInvites = profile?.licensePlan === 'admin_monthly' || profile?.licensePlan === 'admin_yearly'
  const canInviteMore = canCreateInvites && subMemberCount < (profile?.memberLimit || 0)

  const filteredStakeholders = stakeholders.filter(s => {
    const matchesSearch = s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter
    return matchesSearch && matchesTier
  })

  const tierDistribution = [
    { name: 'Platinum', value: stakeholders.filter(s => s.tier === 'platinum').length, color: '#e2e8f0' },
    { name: 'Gold', value: stakeholders.filter(s => s.tier === 'gold').length, color: '#f5c518' },
    { name: 'Silver', value: stakeholders.filter(s => s.tier === 'silver').length, color: '#94a3b8' },
    { name: 'Bronze', value: stakeholders.filter(s => s.tier === 'bronze').length, color: '#b45309' }
  ]

  const sharesByTier = [
    { tier: 'Platinum', shares: stakeholders.filter(s => s.tier === 'platinum').reduce((sum, s) => sum + (s.totalShares || 0), 0) },
    { tier: 'Gold', shares: stakeholders.filter(s => s.tier === 'gold').reduce((sum, s) => sum + (s.totalShares || 0), 0) },
    { tier: 'Silver', shares: stakeholders.filter(s => s.tier === 'silver').reduce((sum, s) => sum + (s.totalShares || 0), 0) },
    { tier: 'Bronze', shares: stakeholders.filter(s => s.tier === 'bronze').reduce((sum, s) => sum + (s.totalShares || 0), 0) }
  ]

  const tierColors = {
    platinum: 'text-slate-200 bg-slate-200/20',
    gold: 'text-accent-gold bg-accent-gold/20',
    silver: 'text-slate-400 bg-slate-400/20',
    bronze: 'text-amber-700 bg-amber-700/20'
  }

  const handleGenerateInvite = async () => {
    setInviteError('')

    if (!canCreateInvites) {
      setInviteError('Free Startup License includes 0 sub members. Upgrade to add sub members.')
      return
    }

    if (billingPending) {
      setInviteError('Payment integration coming next. Continue in pending_payment mode before inviting sub members.')
      return
    }

    if (!canInviteMore) {
      setInviteError(`You have reached your sub-member limit of ${profile?.memberLimit || 0}.`)
      return
    }

    try {
      const code = await createInviteCode(user.uid, { maxUses: 1 })
      setGeneratedCode(code)
    } catch (error) {
      console.error('Error generating invite:', error)
      setInviteError('Failed to generate invite code')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stakeholders</h1>
          <p className="text-slate-400">{totalPool.activeStakeholders} active stakeholders</p>
          {billingPending && (
            <p className="mt-2 text-sm text-accent-gold">
              Payment integration coming next. Continue in pending_payment mode.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvestModal(true)}
            className="px-4 py-2 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add Investment
          </button>
          <button
            onClick={() => navigate('/invite-members')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invite Members
          </button>
        </div>
      </div>

      {/* My Stake Card */}
      {myStake && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-accent-gold/20 to-amber-800/10 border border-accent-gold/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Your Stake</h2>
              <p className="text-slate-400 text-sm">Your ownership in the pool</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-slate-400">Total Shares</div>
                <div className="text-2xl font-bold">{myStake.totalShares}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Ownership</div>
                <div className="text-2xl font-bold text-accent-gold">
                  {calculateSharePercentage(myStake.totalShares)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Investment</div>
                <div className="text-2xl font-bold">${myStake.investmentAmount?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Tier</div>
                <div className={`text-2xl font-bold capitalize ${tierColors[myStake.tier]?.split(' ')[0]}`}>
                  {myStake.tier}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Sub members</div>
                <div className="text-2xl font-bold text-white">
                  {subMemberCount}/{profile?.memberLimit || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier Distribution Pie Chart */}
        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <h2 className="text-lg font-semibold mb-4">Stakeholder Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shares by Tier Bar Chart */}
        <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
          <h2 className="text-lg font-semibold mb-4">Shares by Tier</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sharesByTier}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="tier" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="shares" fill="#f5c518" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stakeholders..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-card border border-surface-border rounded-lg"
        >
          <option value="all">All Tiers</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
      </div>

      {/* Stakeholders Table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Stakeholder</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Tier</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Shares</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Ownership</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Investment</th>
            </tr>
          </thead>
          <tbody>
            {filteredStakeholders.map((stakeholder, i) => (
              <tr key={stakeholder.id} className="border-b border-surface-border last:border-0 table-row-hover">
                <td className="px-6 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-accent-gold/20 text-accent-gold' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    i === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-surface-dark text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {stakeholder.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{stakeholder.fullName}</div>
                      <div className="text-sm text-slate-400">{stakeholder.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${tierColors[stakeholder.tier]}`}>
                    {stakeholder.tier}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold">
                  {stakeholder.totalShares?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-accent-gold font-medium">
                  {calculateSharePercentage(stakeholder.totalShares)}%
                </td>
                <td className="px-6 py-4">
                  ${stakeholder.investmentAmount?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Investment Modal */}
      <AnimatePresence>
        {showInvestModal && (
          <InvestmentModal
            onClose={() => setShowInvestModal(false)}
            onInvest={async (amount) => {
              await addInvestment(amount)
              setShowInvestModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            onClose={() => { setShowInviteModal(false); setGeneratedCode(null); setInviteError('') }}
            onGenerate={handleGenerateInvite}
            generatedCode={generatedCode}
            inviteError={inviteError}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function InvestmentModal({ onClose, onInvest }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const presets = [100, 500, 1000, 5000]
  const shares = Math.floor(parseFloat(amount || 0) / 100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onInvest(parseFloat(amount))
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
          <h2 className="text-xl font-bold">Add Investment</h2>
          <p className="text-slate-400 text-sm">Increase your stake in the pool</p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="100"
              required
              className="w-full px-4 py-3 bg-surface-dark border border-surface-border rounded-lg text-2xl font-bold text-center"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2">
            {presets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="flex-1 py-2 bg-surface-dark hover:bg-surface-border rounded-lg text-sm transition-colors"
              >
                ${preset}
              </button>
            ))}
          </div>

          {amount && (
            <div className="p-4 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-400">Shares you'll receive</span>
                <span className="font-bold text-accent-gold">{shares} shares</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">1 share per $100 invested</p>
            </div>
          )}

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
              disabled={loading || !amount || parseFloat(amount) < 100}
              className="flex-1 py-2.5 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Invest'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function InviteModal({ onClose, onGenerate, generatedCode, inviteError }) {
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
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Invite New Stakeholder</h2>
          <p className="text-slate-400 text-sm">Generate an invite code to share with someone</p>

          {inviteError && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {inviteError}
            </div>
          )}

          {generatedCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg text-center">
                <div className="text-sm text-slate-400 mb-2">Invite Code</div>
                <div className="text-2xl font-mono font-bold text-accent-emerald tracking-wider">
                  {generatedCode}
                </div>
              </div>
              <div className="p-3 bg-surface-dark rounded-lg text-sm text-slate-400">
                Share this link:{' '}
                <span className="text-primary-400 break-all">
                  {window.location.origin}/invite/code?code={generatedCode}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/invite/code?code=${generatedCode}`)
                }}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Copy Link
              </button>
            </div>
          ) : (
            <button
              onClick={onGenerate}
              className="w-full py-3 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-semibold transition-colors"
            >
              Generate Invite Code
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-surface-dark hover:bg-surface-border rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
