import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import AlertCard from '../components/auth/AlertCard'
import OptionTile from '../components/auth/OptionTile'
import { PAYMENT_METHODS, getPlanById, planRequiresPayment } from '../config/plans'
import { mergePendingOnboarding, readPendingOnboarding } from '../utils/onboardingState'

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pending = readPendingOnboarding()
  const returnTo = location.state?.returnTo || pending?.returnTo || '/signup'
  const inviteCode = location.state?.inviteCode || pending?.inviteCode || ''
  const onboardingSource = location.state?.onboardingSource || pending?.onboardingSource || 'signup'
  const plan = getPlanById(pending?.licensePlan)
  const validPaymentSession = pending && planRequiresPayment(plan.id)
  const [selectedMethod, setSelectedMethod] = useState(pending?.paymentMethod || PAYMENT_METHODS[0].id)

  if (!validPaymentSession) {
    return (
      <AuthShell maxWidth="max-w-2xl">
        <div className="glass rounded-3xl p-10 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-white">Payment step unavailable</h1>
          <p className="text-slate-400">
            Choose a paid plan first, then return here to set the placeholder billing method.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup" className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700">
              Create account
            </Link>
            <Link to="/pricing" className="rounded-xl border border-surface-border bg-surface-darker/60 px-6 py-3 font-semibold text-white transition-colors hover:bg-surface-border">
              View pricing
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell maxWidth="max-w-4xl">
      <div className="glass rounded-3xl p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-5">
            <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">Payment step</div>
            <h1 className="text-3xl font-bold text-white">Choose how billing should start</h1>
            <p className="text-slate-400">
              Payment integration coming next. Continue in pending_payment mode until a real checkout flow is connected.
            </p>

            <AlertCard tone="warning">
              This is a placeholder billing step. We record the intended payment path, but we do not fake a completed payment.
            </AlertCard>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <OptionTile
                  key={method.id}
                  active={selectedMethod === method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  title={method.title}
                  description={method.description}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface-darker/50 p-6 space-y-5">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Selected plan</div>
              <div className="mt-2 text-2xl font-semibold text-white">{plan.title}</div>
              <div className="text-accent-gold">{plan.priceDisplay}</div>
              <div className="mt-2 text-sm text-slate-400">{plan.details}</div>
            </div>

            {onboardingSource === 'invite' && inviteCode && (
              <div className="rounded-xl border border-accent-emerald/20 bg-accent-emerald/10 p-4 text-sm text-slate-200">
                Invite confirmed for code <span className="font-mono text-white">{inviteCode}</span>
              </div>
            )}

            <div className="rounded-xl border border-surface-border bg-surface-darker p-4 text-sm text-slate-300">
              Next step:
              <div className="mt-2 text-white">
                Return to account creation and finish setup with {pending?.authMethod === 'google' ? 'Google' : 'email + password'}.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                mergePendingOnboarding({ paymentMethod: selectedMethod })
                navigate(returnTo, {
                  state: inviteCode ? { inviteCode } : undefined
                })
              }}
              className="w-full rounded-xl bg-accent-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-500"
            >
              Continue to account creation
            </button>

            <button
              type="button"
              onClick={() => navigate(returnTo, { state: inviteCode ? { inviteCode } : undefined })}
              className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-6 py-3 font-semibold text-white transition-colors hover:bg-surface-border"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
