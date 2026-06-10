import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { mergePendingOnboarding } from '../utils/onboardingState'

const featureCards = [
  {
    title: 'Start a custom online shop',
    description: 'Launch a polished storefront for products, services, or custom orders without starting from scratch.'
  },
  {
    title: 'Build a client portal',
    description: 'Give customers a private place for updates, approvals, files, and project communication.'
  },
  {
    title: 'Manage customers and orders',
    description: 'Keep the everyday work organized in one place so the team can move faster and stay aligned.'
  },
  {
    title: 'Add custom CRM or website integrations',
    description: 'Connect your tools when you need them, whether that is CRM, support, fulfillment, or internal systems.'
  },
  {
    title: 'Connect business tools when needed',
    description: 'Bring together the tools your business already uses without forcing a one-size-fits-all workflow.'
  },
  {
    title: 'Grow into a full business platform',
    description: 'Start simple, then expand your workspace as your business, team, and customer needs grow.'
  }
]

const useCases = [
  {
    title: 'For custom shops',
    description: 'Create a branded store that feels designed for your customers from the first visit.'
  },
  {
    title: 'For service teams',
    description: 'Use client portals and shared workflows to keep communication, tasks, and approvals in sync.'
  },
  {
    title: 'For growing businesses',
    description: 'Tie together storefronts, CRM, and internal tools in one practical platform.'
  }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')

  const handleInviteCta = () => {
    const normalizedInvite = inviteCode.trim().toUpperCase()

    if (normalizedInvite) {
      mergePendingOnboarding({
        onboardingSource: 'invite',
        inviteCode: normalizedInvite,
        returnTo: '/invite/register'
      })
    }

    navigate('/invite/code', normalizedInvite ? { state: { inviteCode: normalizedInvite } } : undefined)
  }

  return (
    <div className="min-h-screen bg-surface-darker">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-emerald/10" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-emerald/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <nav className="mb-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-emerald">
                <span className="font-bold text-white">CS</span>
              </div>
              <span className="text-xl font-bold gradient-text">ConceptSHOP</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="px-4 py-2 text-slate-300 transition-colors hover:text-white">
                Pricing
              </Link>
              <Link to="/login" className="px-4 py-2 text-slate-300 transition-colors hover:text-white">
                Sign In
              </Link>
              <Link to="/signup" className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium transition-colors hover:bg-primary-700">
                Create Account
              </Link>
              <Link to="/invite/code" className="rounded-lg border border-surface-border bg-surface-darker/60 px-5 py-2.5 font-medium text-white transition-colors hover:bg-surface-border">
                Join with Invite
              </Link>
            </div>
          </nav>

          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent-gold/20 bg-accent-gold/10 px-4 py-2 text-sm text-accent-gold">
                <span className="h-2 w-2 rounded-full bg-accent-gold animate-pulse" />
                Invite-only access
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
                Start a custom online shop.
                <span className="gradient-text"> Build a client portal.</span>
                <br />
                Grow into a full business platform.
              </h1>

              <p className="mx-auto mb-10 max-w-3xl text-xl text-slate-400">
                ConceptSHOP helps you launch storefronts, manage customers and orders, connect business tools, and add custom integrations from one workspace.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-primary-700 hover:to-primary-800 sm:w-auto"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="w-full rounded-xl border border-surface-border bg-surface-darker/60 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-surface-border sm:w-auto"
                >
                  Sign In
                </Link>
                <Link
                  to="/invite/code"
                  className="w-full rounded-xl bg-accent-gold px-8 py-4 text-lg font-semibold text-black transition-colors hover:bg-amber-500 sm:w-auto"
                >
                  Join with Invite
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid gap-6 md:grid-cols-3"
          >
            {[
              { value: 'Online shops', label: 'Start simple' },
              { value: 'Client portals', label: 'Stay connected' },
              { value: 'Business tools', label: 'Scale when ready' }
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-6 text-center">
                <div className="text-3xl font-bold gradient-text-gold">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <section className="bg-surface-dark py-24" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Build the kind of business experience your customers actually need
            </h2>
            <p className="mx-auto max-w-3xl text-slate-400">
              Start with a focused shop or portal, then expand into a complete platform as your business grows.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="card-hover rounded-xl border border-surface-border bg-surface-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/20">
                  <span className="text-sm font-bold text-primary-300">0{index + 1}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="rounded-xl border border-surface-border bg-surface-card p-8">
                <h3 className="text-2xl font-semibold text-white">{useCase.title}</h3>
                <p className="mt-4 text-slate-400">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="glass rounded-2xl p-12">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Have an invite code?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-400">
              Enter your code to join ConceptSHOP and continue into the invite-only account creation flow.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <input
                type="text"
                id="inviteCodeInput"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="Enter invite code"
                className="w-full rounded-lg border border-surface-border bg-surface-darker px-4 py-3 text-center font-mono tracking-[0.2em] focus:border-primary-500 focus:outline-none sm:w-80"
              />
              <button
                type="button"
                onClick={handleInviteCta}
                className="w-full rounded-lg bg-accent-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-500 sm:w-auto"
              >
                Join with Invite
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-emerald">
              <span className="text-sm font-bold text-white">CS</span>
            </div>
            <span className="font-semibold">ConceptSHOP</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/login" className="hover:text-white">Sign In</Link>
            <Link to="/signup" className="hover:text-white">Create Account</Link>
            <Link to="/invite/code" className="hover:text-white">Join with Invite</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
