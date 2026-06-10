import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetCodeVerified, setResetCodeVerified] = useState(false)
  const [resetCodeEmail, setResetCodeEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const { login, loginWithGoogle, sendResetEmail, validateResetCode, confirmResetPassword } = useAuth()
  const navigate = useNavigate()
  const mode = searchParams.get('mode')
  const actionCode = searchParams.get('oobCode')
  const isRecoveryMode = mode === 'resetPassword' && Boolean(actionCode)

  useEffect(() => {
    let active = true

    const verifyCode = async () => {
      if (!isRecoveryMode || !actionCode) {
        setResetCodeVerified(false)
        setResetCodeEmail('')
        return
      }

      setLoading(true)
      setError('')

      try {
        const recoveredEmail = await validateResetCode(actionCode)
        if (!active) return

        setEmail(recoveredEmail)
        setResetCodeEmail(recoveredEmail)
        setResetCodeVerified(true)
        setShowReset(false)
        setResetSent(false)
      } catch (err) {
        if (!active) return

        setResetCodeVerified(false)
        setError(err.message || 'This recovery link is invalid or has expired')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    verifyCode()

    return () => {
      active = false
    }
  }, [actionCode, isRecoveryMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await sendResetEmail(email)
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteReset = async (e) => {
    e.preventDefault()

    if (!actionCode) {
      setError('This recovery link is invalid or has expired')
      return
    }

    if (newPassword.length < 6) {
      setError('Password should be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)

    try {
      await confirmResetPassword(actionCode, newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setResetCodeVerified(false)
      navigate('/login?reset=success', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const hasResetSuccess = searchParams.get('reset') === 'success'

  return (
    <div className="min-h-screen bg-surface-darker flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-darker to-accent-emerald/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-emerald/10 rounded-full blur-3xl" />

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
          <h1 className="text-2xl font-bold text-center mb-2">
            {isRecoveryMode ? 'Choose a New Password' : showReset ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-center mb-8">
            {isRecoveryMode
              ? 'Create a new password to finish recovering your account'
              : showReset
              ? 'Enter your email to receive a reset link'
              : 'Sign in to your existing ConceptSHOP account'}
          </p>

          {hasResetSuccess && !isRecoveryMode && (
            <div className="mb-6 p-4 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg text-accent-emerald text-sm">
              Your password has been updated. You can sign in now.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {isRecoveryMode ? (
            resetCodeVerified ? (
              <form onSubmit={handleCompleteReset} className="space-y-6">
                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg text-sm text-slate-300">
                  Resetting password for <span className="font-medium text-white">{resetCodeEmail}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter a new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-slate-300">This recovery link can no longer be used.</p>
                <Link to="/login" className="text-primary-400 hover:text-primary-300">
                  Back to sign in
                </Link>
              </div>
            )
          ) : resetSent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-300 mb-4">Check your email for a reset link</p>
              <button
                onClick={() => { setShowReset(false); setResetSent(false) }}
                className="text-primary-400 hover:text-primary-300"
              >
                Back to sign in
              </button>
            </div>
          ) : showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-center text-slate-400 hover:text-white text-sm"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-sm text-primary-400 hover:text-primary-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-darker border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <GoogleAuthButton
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  loading={googleLoading}
                  className="w-full"
                />
              </div>
            </form>
          )}

          {!showReset && !resetSent && (
            <div className="mt-8 pt-6 border-t border-surface-border text-center">
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <p>
                  Need a new workspace?{' '}
                  <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                    Create Account
                  </Link>
                </p>
                <p>
                  Have an invite code?{' '}
                  <Link to="/invite/code" className="text-primary-400 hover:text-primary-300 font-medium">
                    Join ConceptSHOP
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
