import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTheme } from '../context/ThemeContext'
import Sidebar from './layout/Sidebar'
import TopBar from './layout/TopBar'
import { useAuth } from '../context/AuthContext'
import { getTutorialMap } from '../utils/profile'

const TAB_ROUTE_MAP = {
  dashboard: '/dashboard',
  products: '/products',
  orders: '/orders',
  stakeholders: '/stakeholders',
  'invite-members': '/invite-members',
  marketing: '/marketing',
  forecasting: '/forecasting',
  shipping: '/shipping',
  stock: '/stock',
  settings: '/settings'
}

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [activeHintKey, setActiveHintKey] = useState(null)
  const [busy, setBusy] = useState(false)
  const { isDark } = useTheme()
  const { profile, user, refreshProfile } = useAuth()
  const location = useLocation()
  const billingPending = profile?.billingStatus === 'pending_payment'
  const routeKey = useMemo(() => {
    return Object.entries(TAB_ROUTE_MAP).find(([, route]) => location.pathname.startsWith(route))?.[0] || null
  }, [location.pathname])
  const billingLocked = billingPending && routeKey !== 'settings'
  const tutorialMap = useMemo(() => getTutorialMap(), [])

  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      setShowIntro(true)
    } else {
      setShowIntro(false)
    }
  }, [profile?.uid, profile?.onboardingCompleted])

  useEffect(() => {
    if (!routeKey || !profile) {
      setActiveHintKey(null)
      return
    }

    const completedTutorials = profile?.completedTutorials || {}
    if (completedTutorials[routeKey]) {
      setActiveHintKey(null)
      return
    }

    setActiveHintKey(routeKey)
  }, [location.pathname, profile])

  const markOnboardingCompleted = async () => {
    if (!user?.uid || !profile?.uid) {
      setShowIntro(false)
      return
    }

    setBusy(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        updatedAt: serverTimestamp()
      })
      await refreshProfile().catch(() => {})
    } catch (error) {
      console.error('Error completing onboarding intro:', {
        code: error?.code,
        message: error?.message,
        error
      })
    } finally {
      setBusy(false)
      setShowIntro(false)
    }
  }

  const markTutorialCompleted = async (tabKey) => {
    if (!user?.uid || !tabKey) {
      setActiveHintKey(null)
      return
    }

    setBusy(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        [`completedTutorials.${tabKey}`]: true,
        updatedAt: serverTimestamp()
      })
      await refreshProfile().catch(() => {})
    } catch (error) {
      console.error('Error completing dashboard tutorial:', {
        code: error?.code,
        message: error?.message,
        error
      })
    } finally {
      setBusy(false)
      setActiveHintKey(null)
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-surface-darker' : 'bg-gray-50'}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className={`relative flex-1 overflow-y-auto p-6 ${billingLocked ? 'pointer-events-none opacity-50' : ''}`}>
          {children}

          {activeHintKey && tutorialMap[activeHintKey] && (
            <div className="pointer-events-auto absolute right-6 top-6 z-20 w-full max-w-md rounded-3xl border border-primary-500/20 bg-surface-darker/95 p-5 shadow-2xl backdrop-blur-md">
              <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">First-time hint</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{tutorialMap[activeHintKey].title}</h3>
              <p className="mt-2 text-sm text-slate-300">{tutorialMap[activeHintKey].description}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => markTutorialCompleted(activeHintKey)}
                className="mt-4 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Got it
              </button>
            </div>
          )}

          {billingLocked && (
            <div className="pointer-events-auto absolute inset-6 rounded-2xl border border-accent-gold/20 bg-surface-darker/95 backdrop-blur-md flex items-center justify-center p-6">
              <div className="max-w-lg text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-gold/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86l-7.42 12.85A2 2 0 004.59 20h14.82a2 2 0 001.72-3.29L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment pending</h2>
                <p className="text-slate-300 mb-4">
                  Stripe checkout is not connected yet. This plan has been saved as pending payment.
                </p>
                <p className="text-sm text-slate-400">
                  Your account is active, but dashboard and team-member features are locked until billing is connected.
                </p>
              </div>
            </div>
          )}

          {showIntro && !billingPending && (
            <div className="pointer-events-auto absolute inset-6 z-30 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-3xl border border-surface-border bg-surface-darker/95 p-8 shadow-2xl backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.25em] text-accent-gold">Welcome to ConceptSHOP</div>
                <h2 className="mt-2 text-3xl font-bold text-white">Your workspace tour is ready</h2>
                <p className="mt-3 text-slate-300">
                  Here’s a quick overview of where everything lives the first time you sign in.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {[
                    'Dashboard overview',
                    'Products and custom shop area',
                    'Orders and customers',
                    'Marketing and growth tools',
                    'Invite and team management',
                    'Settings and account tier'
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={markOnboardingCompleted}
                    className="rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start tour
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={markOnboardingCompleted}
                    className="rounded-xl border border-surface-border bg-surface-darker/60 px-5 py-3 font-semibold text-white transition-colors hover:bg-surface-border disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
