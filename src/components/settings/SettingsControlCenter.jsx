import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { updateProfile } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase/config'
import { updateUserProfile } from '../../firebase/userProfile'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LICENSE_PLANS, normalizeLicensePlan } from '../../config/plans'
import {
  canManageInvites,
  getInviteCapacityLabel,
  getPlanBillingSummary,
  getUserDisplayName,
  getUserEmail,
  getVisiblePlanLabel,
  getWorkspaceBrandLogo,
  getWorkspaceDisplayName
} from '../../utils/profile'

const providerOptions = [
  { value: 'gmail', label: 'Gmail / Google Workspace' },
  { value: 'outlook', label: 'Outlook / Microsoft 365' },
  { value: 'smtp', label: 'SMTP custom' }
]

const integrationLabels = {
  crm: 'CRM',
  sql: 'SQL Database',
  aws: 'AWS',
  shipping: 'Shipping',
  inventory: 'Inventory',
  webhook: 'Webhook'
}

const futureDataCards = [
  'CRM contacts',
  'Seller accounts',
  'Buyer accounts',
  'Orders',
  'Shipping records',
  'Inventory records',
  'SQL database links',
  'AWS/customer infrastructure links'
]

const buildSafeIntegration = (current = {}) => ({
  status: current.status || 'not_connected',
  endpointUrl: current.endpointUrl || '',
  tokenInput: '',
  tokenLast4: current.tokenLast4 || '',
  updatedAt: current.updatedAt || null
})

const buildSafeStripe = (current = {}) => ({
  status: current.status || 'not_connected',
  publishableKeyLast4: current.publishableKeyLast4 || '',
  endpointUrl: current.endpointUrl || '',
  tokenInput: '',
  updatedAt: current.updatedAt || null
})

const buildSafeEmailPipeline = (current = {}) => ({
  provider: current.provider || 'gmail',
  senderEmail: current.senderEmail || '',
  connectionStatus: current.connectionStatus || 'not_connected',
  tokenInput: '',
  tokenLast4: current.tokenLast4 || '',
  updatedAt: current.updatedAt || null
})

const buildSafePaymentSummary = (current = {}) => ({
  type: current.type || 'card',
  status: current.status || 'not_connected',
  last4: current.last4 || '',
  updatedAt: current.updatedAt || null
})

const createFormFromProfile = (profile = {}) => ({
  displayName: profile.displayName || '',
  workspaceName: profile.workspaceName || '',
  businessName: profile.businessName || '',
  logoUrl: profile.logoUrl || '',
  photoURL: profile.photoURL || '',
  emailPipeline: buildSafeEmailPipeline(profile.emailPipeline || {}),
  paymentMethodSummary: buildSafePaymentSummary(profile.paymentMethodSummary || {}),
  integrations: {
    stripe: buildSafeStripe(profile.integrations?.stripe || {}),
    crm: buildSafeIntegration(profile.integrations?.crm || {}),
    sql: buildSafeIntegration(profile.integrations?.sql || {}),
    aws: buildSafeIntegration(profile.integrations?.aws || {}),
    shipping: buildSafeIntegration(profile.integrations?.shipping || {}),
    inventory: buildSafeIntegration(profile.integrations?.inventory || {}),
    webhook: buildSafeIntegration(profile.integrations?.webhook || {})
  }
})

const sanitizeLast4 = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '').slice(-4)

const SectionCard = ({ id, eyebrow, title, description, children, className = '', status = null }) => (
  <section id={id} className={`rounded-3xl border border-surface-border bg-surface-card/70 p-6 ${className}`.trim()}>
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>}
      </div>
      {status && (
        <div
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            status.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : status.type === 'saving'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald'
          }`}
        >
          {status.label}
        </div>
      )}
    </div>
    {children}
  </section>
)

const IntegrationCard = ({ title, data, onChange, statusOptions, isDark, showToken = true }) => {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</div>
          <div className="mt-1 text-lg font-semibold text-white">{integrationLabels[title.toLowerCase()] || title}</div>
        </div>
        <div className="rounded-full border border-surface-border bg-surface-darker/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-gold">
          {data.status}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Status</label>
          <select
            value={data.status}
            onChange={(event) => onChange({ ...data, status: event.target.value })}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'bg-surface-darker border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Endpoint URL</label>
          <input
            value={data.endpointUrl}
            onChange={(event) => onChange({ ...data, endpointUrl: event.target.value })}
            placeholder="https://api.example.com/webhook"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'bg-surface-darker border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          />
        </div>

        {showToken && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Token / key</label>
            <input
              value={data.tokenInput}
              onChange={(event) => onChange({ ...data, tokenInput: event.target.value })}
              placeholder="Enter token, only last 4 are stored"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'bg-surface-darker border-surface-border text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>
        )}

        <div className={`rounded-xl border px-3 py-2 text-xs ${isDark ? 'border-surface-border bg-surface-darker/60 text-slate-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
          Secret not stored — backend vault required.
        </div>
      </div>
    </div>
  )
}

export default function SettingsControlCenter() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const { user, profile, refreshProfile, isPlatformAdmin } = useAuth()
  const [form, setForm] = useState(() => createFormFromProfile(profile || {}))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [sectionStatus, setSectionStatus] = useState({
    profile: null,
    workspace: null,
    billing: null,
    payments: null,
    email: null,
    integrations: null
  })

  useEffect(() => {
    setForm(createFormFromProfile(profile || {}))
    setLogoPreview(profile?.logoUrl || '')
  }, [profile?.uid, profile?.updatedAt])

  const displayName = getUserDisplayName(profile, user)
  const email = getUserEmail(profile, user)
  const currentPlanLabel = getVisiblePlanLabel(profile)
  const currentBillingSummary = getPlanBillingSummary(profile)
  const currentInviteCapacity = getInviteCapacityLabel(profile, 0)
  const canInvite = canManageInvites(profile)
  const memberLimitLabel = profile?.memberLimit === -1 ? 'Unlimited' : (profile?.memberLimit ?? 0)

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateIntegration = (key, value) => {
    setForm((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [key]: typeof value === 'function' ? value(prev.integrations[key]) : value
      }
    }))
  }

  const updatePaymentSummary = (value) => {
    setForm((prev) => ({ ...prev, paymentMethodSummary: { ...prev.paymentMethodSummary, ...value } }))
  }

  const updateEmailPipeline = (value) => {
    setForm((prev) => ({ ...prev, emailPipeline: { ...prev.emailPipeline, ...value } }))
  }

  const persistProfile = async (sectionKey, patch, successText = 'Settings saved successfully') => {
    if (!user?.uid) return

    setSectionStatus((prev) => ({
      ...prev,
      [sectionKey]: { type: 'saving', label: 'Saving...' }
    }))

    try {
      await updateUserProfile(user.uid, patch)
      await refreshProfile().catch(() => {})
      setSectionStatus((prev) => ({
        ...prev,
        [sectionKey]: { type: 'success', label: 'Saved' }
      }))
      setMessage({ type: 'success', text: successText })
    } catch (error) {
      console.error(`Error saving ${sectionKey} settings:`, {
        code: error?.code,
        message: error?.message,
        error
      })
      setSectionStatus((prev) => ({
        ...prev,
        [sectionKey]: { type: 'error', label: 'Error' }
      }))
      setMessage({ type: 'error', text: error?.message || `Failed to save ${sectionKey}` })
      throw error
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('profile', {
        displayName: form.displayName.trim()
      }, 'Profile saved successfully')

      if (auth.currentUser && form.displayName.trim() && auth.currentUser.displayName !== form.displayName.trim()) {
        await updateProfile(auth.currentUser, { displayName: form.displayName.trim() }).catch(() => {})
      }
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveWorkspace = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('workspace', {
        workspaceName: form.workspaceName.trim(),
        businessName: form.businessName.trim(),
        logoUrl: form.logoUrl.trim(),
        photoURL: profile?.photoURL || form.photoURL || null
      }, 'Workspace branding saved successfully')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const applyBasicPlan = async () => {
    if (!user?.uid) return
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('billing', {
        licensePlan: 'starter',
        billingStatus: 'free',
        memberLimit: 2,
        paymentMethodSummary: {
          type: form.paymentMethodSummary.type,
          status: 'not_required',
          last4: sanitizeLast4(form.paymentMethodSummary.last4),
        }
      }, 'Basic plan applied')
    } catch (error) {
      console.error('Error applying basic plan:', error)
      setMessage({ type: 'error', text: error?.message || 'Failed to apply basic plan' })
    } finally {
      setSaving(false)
    }
  }

  const routeToPayment = (selectedPlan) => {
    navigate('/payment', {
      state: {
        selectedPlan,
        returnTo: '/settings',
        source: 'settings'
      }
    })
  }

  const handlePaidPlanSelection = async (selectedPlan) => {
    if (selectedPlan === 'starter') {
      await applyBasicPlan()
      return
    }

    routeToPayment(selectedPlan)
  }

  const handleSavePayments = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('payments', {
        paymentMethodSummary: {
          type: form.paymentMethodSummary.type,
          status: form.paymentMethodSummary.status,
          last4: sanitizeLast4(form.paymentMethodSummary.last4)
        },
        integrations: {
          ...profile?.integrations,
          stripe: {
            status: form.integrations.stripe.status,
            publishableKeyLast4: sanitizeLast4(form.integrations.stripe.tokenInput || form.integrations.stripe.publishableKeyLast4),
            endpointUrl: form.integrations.stripe.endpointUrl.trim()
          }
        }
      }, 'Payment metadata saved successfully')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveEmail = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('email', {
        emailPipeline: {
          provider: form.emailPipeline.provider,
          senderEmail: form.emailPipeline.senderEmail.trim(),
          connectionStatus: form.emailPipeline.connectionStatus,
          tokenLast4: sanitizeLast4(form.emailPipeline.tokenInput || form.emailPipeline.tokenLast4)
        }
      }, 'Email pipeline saved successfully')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveIntegrations = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistProfile('integrations', {
        integrations: {
          stripe: {
            status: form.integrations.stripe.status,
            publishableKeyLast4: sanitizeLast4(form.integrations.stripe.tokenInput || form.integrations.stripe.publishableKeyLast4),
            endpointUrl: form.integrations.stripe.endpointUrl.trim()
          },
          crm: {
            status: form.integrations.crm.status,
            endpointUrl: form.integrations.crm.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.crm.tokenInput || form.integrations.crm.tokenLast4)
          },
          sql: {
            status: form.integrations.sql.status,
            endpointUrl: form.integrations.sql.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.sql.tokenInput || form.integrations.sql.tokenLast4)
          },
          aws: {
            status: form.integrations.aws.status,
            endpointUrl: form.integrations.aws.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.aws.tokenInput || form.integrations.aws.tokenLast4)
          },
          shipping: {
            status: form.integrations.shipping.status,
            endpointUrl: form.integrations.shipping.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.shipping.tokenInput || form.integrations.shipping.tokenLast4)
          },
          inventory: {
            status: form.integrations.inventory.status,
            endpointUrl: form.integrations.inventory.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.inventory.tokenInput || form.integrations.inventory.tokenLast4)
          },
          webhook: {
            status: form.integrations.webhook.status,
            endpointUrl: form.integrations.webhook.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.webhook.tokenInput || form.integrations.webhook.tokenLast4)
          }
        }
      }, 'Integrations saved successfully')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setMessage(null)
    try {
      setSectionStatus({
        profile: { type: 'saving', label: 'Saving...' },
        workspace: { type: 'saving', label: 'Saving...' },
        billing: { type: 'saving', label: 'Saving...' },
        payments: { type: 'saving', label: 'Saving...' },
        email: { type: 'saving', label: 'Saving...' },
        integrations: { type: 'saving', label: 'Saving...' }
      })

      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        workspaceName: form.workspaceName.trim(),
        businessName: form.businessName.trim(),
        logoUrl: form.logoUrl.trim(),
        photoURL: profile?.photoURL || form.photoURL || null,
        licensePlan: profile?.licensePlan || 'starter',
        billingStatus: profile?.billingStatus || 'free',
        memberLimit: profile?.memberLimit ?? 2,
        paymentMethodSummary: {
          type: form.paymentMethodSummary.type,
          status: form.paymentMethodSummary.status,
          last4: sanitizeLast4(form.paymentMethodSummary.last4)
        },
        emailPipeline: {
          provider: form.emailPipeline.provider,
          senderEmail: form.emailPipeline.senderEmail.trim(),
          connectionStatus: form.emailPipeline.connectionStatus,
          tokenLast4: sanitizeLast4(form.emailPipeline.tokenInput || form.emailPipeline.tokenLast4)
        },
        integrations: {
          stripe: {
            status: form.integrations.stripe.status,
            publishableKeyLast4: sanitizeLast4(form.integrations.stripe.tokenInput || form.integrations.stripe.publishableKeyLast4),
            endpointUrl: form.integrations.stripe.endpointUrl.trim()
          },
          crm: {
            status: form.integrations.crm.status,
            endpointUrl: form.integrations.crm.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.crm.tokenInput || form.integrations.crm.tokenLast4)
          },
          sql: {
            status: form.integrations.sql.status,
            endpointUrl: form.integrations.sql.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.sql.tokenInput || form.integrations.sql.tokenLast4)
          },
          aws: {
            status: form.integrations.aws.status,
            endpointUrl: form.integrations.aws.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.aws.tokenInput || form.integrations.aws.tokenLast4)
          },
          shipping: {
            status: form.integrations.shipping.status,
            endpointUrl: form.integrations.shipping.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.shipping.tokenInput || form.integrations.shipping.tokenLast4)
          },
          inventory: {
            status: form.integrations.inventory.status,
            endpointUrl: form.integrations.inventory.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.inventory.tokenInput || form.integrations.inventory.tokenLast4)
          },
          webhook: {
            status: form.integrations.webhook.status,
            endpointUrl: form.integrations.webhook.endpointUrl.trim(),
            tokenLast4: sanitizeLast4(form.integrations.webhook.tokenInput || form.integrations.webhook.tokenLast4)
          }
        }
      })

      await refreshProfile().catch(() => {})
      setSectionStatus({
        profile: { type: 'success', label: 'Saved' },
        workspace: { type: 'success', label: 'Saved' },
        billing: { type: 'success', label: 'Saved' },
        payments: { type: 'success', label: 'Saved' },
        email: { type: 'success', label: 'Saved' },
        integrations: { type: 'success', label: 'Saved' }
      })
      setMessage({ type: 'success', text: 'All settings saved successfully' })
    } catch (error) {
      console.error('Error saving all settings:', error)
      setSectionStatus((prev) => ({
        ...prev,
        profile: { type: 'error', label: 'Error' },
        workspace: { type: 'error', label: 'Error' },
        billing: { type: 'error', label: 'Error' },
        payments: { type: 'error', label: 'Error' },
        email: { type: 'error', label: 'Error' },
        integrations: { type: 'error', label: 'Error' }
      }))
      setMessage({ type: 'error', text: error?.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const inviteCapacityText = isPlatformAdmin
    ? 'Unlimited / admin override'
    : currentInviteCapacity

  const planCards = LICENSE_PLANS.map((plan) => {
    const isCurrent = normalizeLicensePlan(profile?.licensePlan) === plan.id
    const buttonText = plan.id === 'starter'
      ? isCurrent ? 'Current plan' : 'Apply Basic'
      : isCurrent ? 'Current plan' : `Switch to ${plan.title}`

    return {
      ...plan,
      isCurrent,
      buttonText
    }
  })

  return (
    <div className="space-y-6">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 text-sm ${
            message.type === 'error'
              ? 'border-red-500/20 bg-red-500/10 text-red-300'
              : message.type === 'info'
                ? 'border-primary-500/20 bg-primary-500/10 text-primary-200'
                : 'border-accent-emerald/20 bg-accent-emerald/10 text-accent-emerald'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">Settings control center</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Account, billing, and integration controls</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Use this workspace to manage your identity, branding, plan, payment placeholders, email pipeline, and future integrations.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan</div>
            <div className="mt-1 text-lg font-semibold text-white">{currentPlanLabel}</div>
            <div className="text-xs text-slate-400">{currentBillingSummary}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Billing</div>
            <div className="mt-1 text-lg font-semibold text-white">{profile?.billingStatus || 'free'}</div>
            <div className="text-xs text-slate-400">Member limit {memberLimitLabel}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Invite capacity</div>
            <div className="mt-1 text-lg font-semibold text-white">{inviteCapacityText}</div>
            <div className="text-xs text-slate-400">{canInvite ? 'Invites enabled' : 'Invite access locked'}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Identity</div>
            <div className="mt-1 text-lg font-semibold text-white">{displayName}</div>
            <div className="text-xs text-slate-400">{email}</div>
          </div>
        </div>
      </div>

      {isPlatformAdmin && (
        <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4 text-sm text-primary-100">
          Platform admin override is active. You can inspect and test settings, integrations, and access controls regardless of billing state.
        </div>
      )}

      <SectionCard
        id="profile"
        eyebrow="Profile"
        title="User and business identity"
        description="Keep your public identity, auth source, and platform role in sync."
        status={sectionStatus.profile}
      >
        <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-surface-border bg-surface-darker/60 flex items-center justify-center">
                {getWorkspaceBrandLogo(profile) || logoPreview ? (
                  <img src={form.logoUrl || logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">CS</span>
                )}
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Current identity</div>
                <div className="mt-1 text-xl font-semibold text-white">{getUserDisplayName(profile, user)}</div>
                <div className="text-sm text-slate-400">{getUserEmail(profile, user)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-surface-border bg-surface-darker/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-gold">
                    {getVisiblePlanLabel(profile)}
                  </span>
                  {profile?.platformRole === 'platform_admin' && (
                    <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">
                      Platform Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-surface-border bg-surface-darker/60 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Avatar / photoURL preview</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-surface-border bg-surface-darker flex items-center justify-center">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">CS</span>
                  )}
                </div>
                <div className="min-w-0 text-sm text-slate-400">
                  <div className="font-medium text-white">{profile?.photoURL ? 'Avatar loaded' : 'No avatar image yet'}</div>
                  <div className="truncate">{profile?.photoURL || 'Google photoURL or uploaded avatar will appear here.'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Display name</label>
              <input
                value={form.displayName}
                onChange={(event) => updateForm('displayName', event.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                placeholder="Your name or workspace name"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <input value={email} disabled className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 text-slate-400" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Auth provider</label>
                <input value={profile?.authProvider || 'password'} disabled className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 text-slate-400" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Role</label>
                <input value={profile?.role || 'admin'} disabled className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 text-slate-400" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Platform role</label>
                <input value={profile?.platformRole || 'user'} disabled className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save display name
              </button>
              <button
                type="button"
                onClick={() => setMessage({ type: 'info', text: 'Avatar uploads should be wired to storage later. For now, use a hosted logo URL in the Workspace section.' })}
                className="rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
              >
                Avatar note
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="workspace"
        eyebrow="Workspace / Brand"
        title="Workspace and logo"
        description="Store your workspace name, business name, and logo URL so the sidebar and topbar can show the right brand."
        status={sectionStatus.workspace}
      >
        <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Workspace name</label>
                <input
                  value={form.workspaceName}
                  onChange={(event) => updateForm('workspaceName', event.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="ConceptSHOP workspace"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Business name</label>
                <input
                  value={form.businessName}
                  onChange={(event) => updateForm('businessName', event.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Your company name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Logo URL</label>
              <input
                value={form.logoUrl}
                onChange={(event) => {
                  updateForm('logoUrl', event.target.value)
                  setLogoPreview(event.target.value)
                }}
                className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                placeholder="https://cdn.example.com/logo.png"
              />
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
              Logo upload is a placeholder here. For production, point <code>logoUrl</code> to a hosted asset or wire uploads to backend storage.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={saving}
                className="rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save workspace branding
              </button>
              <button
                type="button"
                onClick={() => setLogoPreview(form.logoUrl)}
                className="rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
              >
                Preview logo
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Sidebar / topbar preview</div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-surface-border bg-surface-darker/70 p-4">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-surface-border bg-surface-darker flex items-center justify-center">
                {(form.logoUrl || logoPreview) ? (
                  <img src={form.logoUrl || logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">CS</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">{getWorkspaceDisplayName({ ...profile, ...form })}</div>
                <div className="truncate text-xs text-slate-400">{getUserDisplayName(profile, user)}</div>
                <div className="mt-1 inline-flex rounded-full border border-surface-border bg-surface-darker/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-gold">
                  {getVisiblePlanLabel(profile)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="billing"
        eyebrow="Plan & Billing"
        title="Current plan, billing status, and upgrades"
        description="Basic applies immediately when available. Premium and Pro route to the payment placeholder and stay in pending_payment until real Stripe checkout is wired."
        status={sectionStatus.billing}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {planCards.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border p-5 ${plan.id === 'pro' ? 'border-accent-gold/30 bg-accent-gold/5' : 'border-surface-border bg-surface-darker/50'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{plan.title}</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{plan.priceDisplay}</div>
                </div>
                <div className="rounded-full border border-surface-border bg-surface-darker/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {plan.badge}
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-400">{plan.description}</p>
              <div className="mt-4 rounded-2xl border border-surface-border bg-surface-darker/60 p-4 text-sm text-slate-300">
                {plan.details}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-surface-border px-3 py-1">Billing: {plan.billingStatus}</span>
                <span className="rounded-full border border-surface-border px-3 py-1">
                  Members: 1 admin / {plan.memberLimit === -1 ? 'unlimited' : `${plan.memberLimit} sub`}
                </span>
              </div>

              <button
                type="button"
                disabled={saving || plan.isCurrent}
                onClick={() => handlePaidPlanSelection(plan.id)}
                className="mt-5 w-full rounded-xl bg-accent-gold px-4 py-3 font-semibold text-black transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current plan</div>
            <div className="mt-1 text-xl font-semibold text-white">{currentPlanLabel}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Billing status</div>
            <div className="mt-1 text-xl font-semibold text-white">{profile?.billingStatus || 'free'}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Member limit</div>
            <div className="mt-1 text-xl font-semibold text-white">{profile?.memberLimit ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Invite capacity</div>
            <div className="mt-1 text-xl font-semibold text-white">{getInviteCapacityLabel(profile, 0)}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="payments"
        eyebrow="Payment Methods"
        title="Payment method placeholders and Stripe status"
        description="Store only safe metadata here. No card numbers, no secret keys, no raw payment credentials."
        status={sectionStatus.payments}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Payment method</div>
                <div className="mt-1 text-lg font-semibold text-white">{form.paymentMethodSummary.type}</div>
              </div>
              <div className="rounded-full border border-surface-border bg-surface-darker/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                {form.paymentMethodSummary.status}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Type</label>
                <select
                  value={form.paymentMethodSummary.type}
                  onChange={(event) => updatePaymentSummary({ type: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                >
                  <option value="card">Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select
                  value={form.paymentMethodSummary.status}
                  onChange={(event) => updatePaymentSummary({ status: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                >
                  <option value="not_connected">Not connected</option>
                  <option value="pending_payment">Pending payment</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Last 4</label>
                <input
                  value={form.paymentMethodSummary.last4}
                  onChange={(event) => updatePaymentSummary({ last4: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                  placeholder="1234"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-surface-border bg-surface-darker/60 p-4 text-sm text-slate-400">
              Stripe integration status: <span className="text-white">{form.integrations.stripe.status}</span>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              Publishable key last 4: <span className="text-white">{form.integrations.stripe.publishableKeyLast4 || 'none stored'}</span>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Stripe setup placeholder</div>
            <p className="mt-2 text-sm text-slate-400">
              Not connected now. Test mode ready can be used for implementation work later, but live billing should wait for backend Stripe checkout.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                <select
                  value={form.integrations.stripe.status}
                  onChange={(event) => updateIntegration('stripe', { ...form.integrations.stripe, status: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                >
                  <option value="not_connected">Not connected</option>
                  <option value="test_mode_ready">Test mode ready</option>
                  <option value="live_later">Live mode later</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Publishable key last 4</label>
                <input
                  value={form.integrations.stripe.tokenInput}
                  onChange={(event) => updateIntegration('stripe', { ...form.integrations.stripe, tokenInput: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                  placeholder="pk_test_..."
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleSavePayments}
                disabled={saving}
                className="rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save payment metadata
              </button>
              <button
                type="button"
                onClick={() => setMessage({ type: 'info', text: 'Stripe secret keys must never be stored in Firestore. Use backend checkout sessions and webhooks.' })}
                className="rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
              >
                Stripe note
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="email"
        eyebrow="Email Pipeline"
        title="Email provider and pipeline placeholders"
        description="Capture safe metadata for provider, sender address, and masked token info. Real sending needs a backend or Cloud Function."
        status={sectionStatus.email}
      >
        <div className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-surface-darker/50 border-surface-border' : 'bg-white border-gray-200'}`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Provider</label>
                <select
                  value={form.emailPipeline.provider}
                  onChange={(event) => updateEmailPipeline({ provider: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                >
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Connection status</label>
                <select
                  value={form.emailPipeline.connectionStatus}
                  onChange={(event) => updateEmailPipeline({ connectionStatus: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                >
                  <option value="not_connected">Not connected</option>
                  <option value="test_mode_ready">Test mode ready</option>
                  <option value="connected">Connected</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Sender email</label>
                <input
                  value={form.emailPipeline.senderEmail}
                  onChange={(event) => updateEmailPipeline({ senderEmail: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                  placeholder="hello@yourcompany.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Token / API last 4</label>
                <input
                  value={form.emailPipeline.tokenInput}
                  onChange={(event) => updateEmailPipeline({ tokenInput: event.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface-darker px-3 py-2.5 text-white"
                  placeholder="Last 4 only stored"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-surface-border bg-surface-darker/60 p-4 text-sm text-slate-400">
              Real sending requires a backend function. Store masked metadata only in Firestore.
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleSaveEmail}
                disabled={saving}
                className="rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save email config
              </button>
              <button
                type="button"
                onClick={() => setMessage({ type: 'info', text: 'Test connection is a placeholder until a backend mail service is connected.' })}
                className="rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
              >
                Test connection
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Connection status</div>
              <div className="mt-1 text-xl font-semibold text-white">{form.emailPipeline.connectionStatus}</div>
              <div className="mt-2 text-sm text-slate-400">Token last 4: {form.emailPipeline.tokenLast4 || 'none stored'}</div>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
              Supported providers: Gmail / Google Workspace, Outlook / Microsoft 365, and custom SMTP.
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="integrations"
        eyebrow="API Connections"
        title="CRM, SQL, AWS, shipping, inventory, and webhooks"
        description="These are future-ready placeholders. Keep the config safe now and move secrets to a backend vault before production."
        status={sectionStatus.integrations}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {Object.entries(integrationLabels).map(([key, label]) => (
            <IntegrationCard
              key={key}
              title={key}
              data={form.integrations[key]}
              isDark={isDark}
              onChange={(nextValue) => updateIntegration(key, nextValue)}
              statusOptions={[
                { value: 'not_connected', label: 'Not connected' },
                { value: 'test_mode_ready', label: 'Test mode ready' },
                { value: 'connected', label: 'Connected' }
              ]}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSaveIntegrations}
            disabled={saving}
            className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save integrations
          </button>
        </div>
      </SectionCard>

      <SectionCard
        id="future"
        eyebrow="Future Data Connections"
        title="Roadmap for CRM, seller, buyer, order, shipping, inventory, SQL, and AWS links"
        description="This section is informational and intentionally disabled for now."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {futureDataCards.map((item) => (
            <div key={item} className="rounded-2xl border border-surface-border bg-surface-darker/40 px-4 py-4 text-sm text-slate-400">
              <div className="font-medium text-white">{item}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Coming soon</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className={`flex justify-end rounded-3xl border ${isDark ? 'border-surface-border bg-surface-card/70' : 'border-gray-200 bg-white'} p-4`}>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save all settings'}
        </button>
      </div>
    </div>
  )
}
