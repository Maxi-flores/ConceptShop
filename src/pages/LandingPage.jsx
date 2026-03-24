import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { seedInitialData } from '../firebase/seed'

export default function LandingPage() {
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const navigate = useNavigate()

  const handleSeedData = async () => {
    setSeeding(true)
    try {
      await seedInitialData()
      setSeeded(true)
    } catch (error) {
      console.error('Seed error:', error)
      alert('Error seeding data. Check console.')
    } finally {
      setSeeding(false)
    }
  }
  return (
    <div className="min-h-screen bg-surface-darker">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-emerald/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-emerald/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
                <span className="text-white font-bold">CS</span>
              </div>
              <span className="text-xl font-bold gradient-text">ConceptSHOP</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold/10 border border-accent-gold/20 rounded-full text-accent-gold text-sm mb-8">
                <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                Stakeholder-Powered Commerce
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Share Orders.{' '}
                <span className="gradient-text">Share Savings.</span>
                <br />
                Share Success.
              </h1>

              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Join a community of stakeholders who pool resources for bulk purchasing,
                intelligent price forecasting, and shared profits. Everyone wins.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-xl font-semibold text-lg transition-all glow-primary"
                >
                  Join as Stakeholder
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-surface-card hover:bg-surface-border border border-surface-border rounded-xl font-semibold text-lg transition-colors"
                >
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: '$2.4M', label: 'Total Pool Value' },
              { value: '1,240+', label: 'Active Stakeholders' },
              { value: '35%', label: 'Avg. Savings' },
              { value: '98%', label: 'Satisfaction Rate' }
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-6 text-center">
                <div className="text-3xl font-bold gradient-text-gold">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ConceptSHOP Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A revolutionary platform combining group buying power with intelligent market analysis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                title: 'Join as Stakeholder',
                description: 'Get an invite code and become part of the community. Your investment and order participation determine your share.'
              },
              {
                icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
                title: 'Pool Orders Together',
                description: 'Join group orders to unlock bulk pricing tiers. The more stakeholders participate, the better the price.'
              },
              {
                icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
                title: 'Smart Forecasting',
                description: 'Our AI analyzes market trends to predict optimal buying times and maximize your savings.'
              },
              {
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Share the Profits',
                description: 'Earn dividends based on your stake. Your shares grow with both investments and order activity.'
              },
              {
                icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
                title: 'Aggregated Shipping',
                description: 'Save on shipping by combining orders to central locations. Track everything in real-time.'
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                title: 'Marketing Analytics',
                description: 'Track campaign performance, ROI, and conversion rates. Make data-driven decisions.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-surface-card border border-surface-border card-hover"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              ConceptSHOP is invite-only to maintain quality and trust.
              Request an invite or enter your code below.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <input
                type="text"
                id="inviteCodeInput"
                placeholder="Enter invite code (e.g., CS-FOUNDER01)"
                className="w-full sm:w-80 px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  const code = document.getElementById('inviteCodeInput').value
                  if (code) navigate(`/invite/${code}`)
                }}
                className="w-full sm:w-auto px-6 py-3 bg-accent-gold hover:bg-amber-500 text-black font-semibold rounded-lg transition-colors"
              >
                Verify Code
              </button>
            </div>

            {/* Seed Data Button - for initial setup */}
            <div className="mt-8 pt-8 border-t border-surface-border">
              {seeded ? (
                <div className="flex items-center justify-center gap-2 text-accent-emerald">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Sample data loaded! Use code: <strong>CS-FOUNDER01</strong></span>
                </div>
              ) : (
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-4 py-2 bg-surface-card hover:bg-surface-border border border-surface-border rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {seeding ? 'Loading sample data...' : 'Load Sample Data (First Time Setup)'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold">ConceptSHOP</span>
            </div>
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} ConceptSHOP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
