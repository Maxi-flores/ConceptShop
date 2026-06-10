import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LICENSE_PLANS, getPlanById, planRequiresPayment } from '../../config/plans'
import { useAuth } from '../../context/AuthContext'
import { mergePendingOnboarding, readPendingOnboarding } from '../../utils/onboardingState'
import AlertCard from './AlertCard'
import GoogleAuthButton from './GoogleAuthButton'
import OnboardingSteps from './OnboardingSteps'
import PlanCard from './PlanCard'

const buildSteps = (onboardingSource) => (
  onboardingSource === 'invite'
    ? ['Invite', 'Plan', 'Account', 'Payment', 'Workspace']
    : ['Plan', 'Account', 'Payment', 'Workspace']
)

const PAYMENT_STEP_MESSAGE = 'Payment is required for this plan. Continue to the payment step first, then return here to finish creating the workspace.'

export default function AccountOnboardingForm({
  onboardingSource,
  inviteCode = '',
  headerEyebrow,
  title,
  description,
  invitePanel = null
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, registerWithGoogle } = useAuth()
  const pending = useMemo(() => readPendingOnboarding(), [location.key])
  const matchesPendingContext = pending?.onboardingSource === onboardingSource && (pending?.inviteCode || '') === inviteCode

  const [selectedPlan, setSelectedPlan] = useState(() => (matchesPendingContext ? pending?.licensePlan || 'free_startup' : 'free_startup'))
  const [selectedMethod, setSelectedMethod] = useState(() => (matchesPendingContext ? pending?.authMethod || 'email' : 'email'))
  const [displayName, setDisplayName] = useState(() => (matchesPendingContext ? pending?.displayName || '' : ''))
  const [email, setEmail] = useState(() => (matchesPendingContext ? pending?.email || '' : ''))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!matchesPendingContext) {
      return
    }

    setSelectedPlan(pending?.licensePlan || 'free_startup')
    setSelectedMethod(pending?.authMethod || 'email')
    setDisplayName(pending?.displayName || '')
    setEmail(pending?.email || '')
  }, [matchesPendingContext, pending])

  const plan = getPlanById(selectedPlan)
  const requiresPayment = planRequiresPayment(selectedPlan)
  const paymentMethod = matchesPendingContext ? pending?.paymentMethod : null
  const paymentSelected = !requiresPayment || Boolean(paymentMethod)
  const steps = buildSteps(onboardingSource)
  const currentStep = onboardingSource === 'invite' ? 2 : 1

  const rememberProgress = () => {
    mergePendingOnboarding({
      onboardingSource,
      inviteCode,
      licensePlan: selectedPlan,
      authMethod: selectedMethod,
      displayName: displayName.trim(),
      email: email.trim(),
      workspaceFocus: pending?.workspaceFocus || 'online_store',
      returnTo: onboardingSource === 'invite' ? '/invite/register' : '/signup'
    })
  }

  const goToPayment = () => {
    rememberProgress()
    navigate('/payment', {
      state: {
        onboardingSource,
        inviteCode,
        returnTo: onboardingSource === 'invite' ? '/invite/register' : '/signup'
      }
    })
  }

  const validateBaseFields = () => {
    if (!displayName.trim()) {
      setError('Please enter a display name.')
      return false
    }

    return true
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!validateBaseFields()) {
      return
    }

    if (requiresPayment && !paymentSelected) {
      goToPayment()
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        licensePlan: selectedPlan,
        workspaceFocus: pending?.workspaceFocus || 'online_store',
        onboardingSource,
        inviteCode,
        paymentMethod
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSubmit = async () => {
    setError('')

    if (!validateBaseFields()) {
      return
    }

    if (requiresPayment && !paymentSelected) {
      goToPayment()
      return
    }

    setGoogleLoading(true)

    try {
      const user = await registerWithGoogle({
        displayName: displayName.trim(),
        licensePlan: selectedPlan,
        workspaceFocus: pending?.workspaceFocus || 'online_store',
        onboardingSource,
        inviteCode,
        paymentMethod
      })

      if (user) {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Failed to create account with Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-8 md:p-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <OnboardingSteps steps={steps} currentStep={currentStep} />

          {headerEyebrow && (
            <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">{headerEyebrow}</div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="mt-3 text-slate-400">{description}</p>
              </div>

              {invitePanel}

              <div className="space-y-3">
                {LICENSE_PLANS.map((licensePlan) => (
                  <PlanCard
                    key={licensePlan.id}
                    plan={licensePlan}
                    active={selectedPlan === licensePlan.id}
                    onClick={() => {
                      setSelectedPlan(licensePlan.id)
                      setError('')
                    }}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-4 text-sm text-slate-400">
                Choose a plan first. Then create your account with Google or email, and continue to payment only if the plan needs it.
              </div>
            </div>

            <div className="space-y-6">
              {error && <AlertCard>{error}</AlertCard>}

              <div className="rounded-2xl border border-surface-border bg-surface-darker/40 p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Create account</div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Choose email or Google</h2>
                  </div>
                  <div className="flex rounded-full border border-surface-border bg-surface-darker/70 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('email')
                        setError('')
                      }}
                      className={`rounded-full px-4 py-2 transition-colors ${selectedMethod === 'email' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('google')
                        setError('')
                      }}
                      className={`rounded-full px-4 py-2 transition-colors ${selectedMethod === 'google' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Google
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 focus:border-primary-500 focus:outline-none"
                    placeholder="Your name or workspace name"
                  />
                </div>

                {selectedMethod === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 focus:border-primary-500 focus:outline-none"
                        placeholder="team@yourbrand.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 focus:border-primary-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-xl border border-surface-border bg-surface-darker px-4 py-3 focus:border-primary-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </div>

                    {requiresPayment && !paymentSelected && (
                      <AlertCard tone="warning">
                        {PAYMENT_STEP_MESSAGE}
                      </AlertCard>
                    )}

                    <button
                      type="submit"
                      disabled={loading || googleLoading}
                      className="w-full rounded-xl bg-accent-gold py-3 font-semibold text-black transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? 'Creating account...'
                        : requiresPayment && !paymentSelected
                          ? 'Continue to payment'
                          : requiresPayment
                            ? 'Create account in pending_payment mode'
                            : 'Create account'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {requiresPayment && !paymentSelected && (
                      <AlertCard tone="warning">
                        {PAYMENT_STEP_MESSAGE}
                      </AlertCard>
                    )}

                    <GoogleAuthButton
                      onClick={handleGoogleSubmit}
                      disabled={googleLoading || loading}
                      loading={googleLoading}
                      className="w-full"
                      label="Google"
                      loadingLabel="Google..."
                    />

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('email')}
                      className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-4 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
                    >
                      Use email instead
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-surface-border pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Already have an account?</span>
                <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
