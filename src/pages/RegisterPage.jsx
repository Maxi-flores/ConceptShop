import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import AlertCard from '../components/auth/AlertCard'
import AccountOnboardingForm from '../components/auth/AccountOnboardingForm'
import { useAuth } from '../context/AuthContext'
import { validateInviteCode } from '../firebase/auth'
import { mergePendingOnboarding, normalizeInviteCode, readPendingOnboarding } from '../utils/onboardingState'

export default function RegisterPage() {
  const { inviteCode: routeInviteCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { finishGoogleRedirectOnboarding } = useAuth()

  const [inviteCode, setInviteCode] = useState('')
  const [validatingInvite, setValidatingInvite] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const bootstrapInvite = async () => {
      const stateInvite = location.state?.inviteCode
      const searchInvite = new URLSearchParams(location.search).get('invite')
      const storedInvite = readPendingOnboarding()?.inviteCode
      const fallbackInvite = routeInviteCode && routeInviteCode !== 'register' ? routeInviteCode : ''
      const normalizedInvite = normalizeInviteCode(stateInvite || searchInvite || fallbackInvite || storedInvite)

      if (!normalizedInvite) {
        if (!active) return
        setInviteValid(false)
        setError('Invalid invite code')
        setValidatingInvite(false)
        return
      }

      try {
        const validation = await validateInviteCode(normalizedInvite)
        if (!active) return

        if (!validation.valid) {
          setInviteValid(false)
          setError(validation.error || 'Invalid invite code')
          return
        }

        mergePendingOnboarding({
          onboardingSource: 'invite',
          inviteCode: validation.inviteCode,
          returnTo: '/invite/register'
        })

        setInviteCode(validation.inviteCode)
        setInviteValid(true)

        const redirectedUser = await finishGoogleRedirectOnboarding({
          onboardingSource: 'invite',
          inviteCode: validation.inviteCode
        })

        if (!active) return
        if (redirectedUser) {
          navigate('/dashboard', { replace: true })
        }
      } catch (inviteError) {
        if (!active) return
        setInviteValid(false)
        setError(inviteError.message || 'Failed to verify invite code')
      } finally {
        if (active) {
          setValidatingInvite(false)
        }
      }
    }

    bootstrapInvite()

    return () => {
      active = false
    }
  }, [finishGoogleRedirectOnboarding, location.search, location.state, navigate, routeInviteCode])

  if (validatingInvite) {
    return (
      <AuthShell maxWidth="max-w-xl">
        <div className="glass rounded-3xl p-10 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" />
          <p className="mt-6 text-slate-400">Validating your invite...</p>
        </div>
      </AuthShell>
    )
  }

  if (!inviteValid) {
    return (
      <AuthShell maxWidth="max-w-xl">
        <div className="glass rounded-3xl p-10 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Invite required</h1>
            <p className="mt-3 text-slate-400">{error || 'A valid invite is required to create a ConceptSHOP account.'}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/invite/code" className="rounded-xl bg-accent-gold px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-500">
              Enter invite code
            </Link>
            <Link to="/signup" className="rounded-xl border border-surface-border bg-surface-darker/60 px-6 py-3 font-semibold text-white transition-colors hover:bg-surface-border">
              Create account instead
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        {error && <AlertCard>{error}</AlertCard>}

        <AccountOnboardingForm
          onboardingSource="invite"
          inviteCode={inviteCode}
          headerEyebrow="Invite onboarding"
          title="Create your invite-based account"
          description="Your invite is valid. Choose a plan, then create your account with Google or email and finish setup."
          invitePanel={(
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/10 p-4 text-sm text-slate-200">
              Invite confirmed for code <span className="font-mono text-white">{inviteCode}</span>
            </div>
          )}
        />
      </div>
    </AuthShell>
  )
}
