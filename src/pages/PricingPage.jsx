import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LICENSE_PLANS } from '../config/plans'
import { mergePendingOnboarding } from '../utils/onboardingState'

const ctaLabels = {
  free_startup: 'Start Free',
  admin_monthly: 'Choose Team',
  admin_yearly: 'Choose Yearly'
}

export default function PricingPage() {
  const navigate = useNavigate()

  const handlePlanCta = (planId) => {
    if (planId === 'free_startup') {
      mergePendingOnboarding({ onboardingSource: 'signup', licensePlan: planId, returnTo: '/signup' })
      navigate('/signup')
      return
    }

    mergePendingOnboarding({ onboardingSource: 'signup', licensePlan: planId, returnTo: '/signup' })
    navigate('/payment')
  }

  return (
    <div className="min-h-screen bg-surface-darker">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-emerald/10" />
        <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-accent-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <nav className="mb-16 flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-emerald">
                <span className="font-bold text-white">CS</span>
              </div>
              <span className="text-xl font-bold gradient-text">ConceptSHOP</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-slate-300 transition-colors hover:text-white">
                Sign In
              </Link>
              <Link to="/signup" className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium transition-colors hover:bg-primary-700">
                Create Account
              </Link>
            </div>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex rounded-full border border-accent-gold/20 bg-accent-gold/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-accent-gold">
              Pricing
            </div>
            <h1 className="text-5xl font-bold leading-tight text-white">
              Simple plans for starting, growing, and billing with clarity.
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              Start with a free workspace, or choose a paid plan when you need collaboration and yearly savings.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {LICENSE_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-3xl border p-6 ${plan.id === 'admin_yearly' ? 'border-accent-gold/30 bg-accent-gold/5' : 'border-surface-border bg-surface-card'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{plan.title}</div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{plan.priceDisplay}</h2>
                  </div>
                  <div className="rounded-full border border-surface-border bg-surface-darker/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {plan.badge}
                  </div>
                </div>

                <p className="mt-4 text-slate-400">{plan.description}</p>
                <div className="mt-5 rounded-2xl border border-surface-border bg-surface-darker/60 p-4 text-sm text-slate-300">
                  {plan.details}
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanCta(plan.id)}
                  className={`mt-6 w-full rounded-xl px-6 py-3 font-semibold transition-colors ${plan.id === 'free_startup' ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-accent-gold text-black hover:bg-amber-500'}`}
                >
                  {ctaLabels[plan.id]}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-surface-border bg-surface-card p-8">
            <h2 className="text-2xl font-semibold text-white">What each plan includes</h2>
            <p className="mt-3 text-slate-400">
              Every plan keeps one admin at the center. Team and Business include up to two team members, while the free plan is a simple starting point.
            </p>
          </div>
          <div className="rounded-3xl border border-surface-border bg-surface-card p-8">
            <h2 className="text-2xl font-semibold text-white">Billing stays honest</h2>
            <p className="mt-3 text-slate-400">
              Paid plans go through the payment placeholder first. If a real processor is not wired in yet, the workspace stays in pending_payment mode instead of pretending billing is complete.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
