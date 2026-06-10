import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { validateInviteCode } from '../firebase/auth'
import { mergePendingOnboarding } from '../utils/onboardingState'

export default function InvitePage() {
  const { code: initialCode } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const stateInvite = location.state?.inviteCode
    const queryInvite = searchParams.get('invite')
    const normalizedInitial = initialCode && initialCode !== 'code' ? initialCode : ''
    const nextInvite = (stateInvite || queryInvite || normalizedInitial || '').toUpperCase()
    if (nextInvite) {
      setInviteCode(nextInvite)
    }
  }, [initialCode, location.state, searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await validateInviteCode(inviteCode)
      if (result.valid) {
        mergePendingOnboarding({
          onboardingSource: 'invite',
          inviteCode: result.inviteCode,
          returnTo: '/invite/register'
        })

        navigate('/invite/register', { state: { inviteCode: result.inviteCode } })
      } else {
        setError(result.error || 'Invalid invite code')
      }
    } catch (err) {
      setError('Error validating code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-darker flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-gold/10" />
      <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-emerald flex items-center justify-center">
              <span className="text-white font-bold text-xl">CS</span>
            </div>
            <span className="text-2xl font-bold gradient-text">ConceptSHOP</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-gold/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Enter Invite Code
          </h1>
          <p className="text-slate-400 text-center mb-8">
            ConceptSHOP is invite-only. Enter your code to continue.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-4 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent text-center text-xl tracking-widest font-mono"
                placeholder="CS-XXXXXXXX"
                maxLength={12}
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Format: CS-XXXXXXXX
              </p>
            </div>

          <button
            type="submit"
            disabled={loading || inviteCode.length < 3}
            className="w-full py-3 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Continue to account creation'}
          </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-border">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Sign in instead
              </Link>
              <div className="mt-2 text-sm text-slate-500">
                Need a new account?{' '}
                <Link to="/signup" className="text-primary-400 hover:text-primary-300">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-surface-dark/50 rounded-xl border border-surface-border">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need an invite?
          </h3>
          <p className="text-sm text-slate-400">
            Ask an existing ConceptSHOP member to generate an invite code for you,
            or contact us at <span className="text-primary-400">invites@conceptshop.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
