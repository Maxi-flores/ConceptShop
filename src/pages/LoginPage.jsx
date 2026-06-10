import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
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
              : 'Sign in to your stakeholder account'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-surface-border rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M21.35 11.1H12v3.7h5.38c-.23 1.23-.97 2.27-2.02 2.97v2.47h3.28c1.92-1.77 3.03-4.38 3.03-7.47 0-.72-.06-1.42-.32-2.14Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.73 0 5.02-.9 6.69-2.44l-3.28-2.47c-.91.61-2.08.98-3.41.98-2.62 0-4.84-1.77-5.63-4.15H2.92v2.58A10 10 0 0 0 12 22Z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.37 13.92A5.99 5.99 0 0 1 6 12c0-.67.12-1.32.37-1.92V7.5H2.92A10 10 0 0 0 2 12c0 1.61.39 3.13.92 4.5l3.45-2.58Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.98c1.49 0 2.82.52 3.87 1.54l2.9-2.9A9.88 9.88 0 0 0 12 2a10 10 0 0 0-9.08 5.5l3.45 2.58C7.16 7.75 9.38 5.98 12 5.98Z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>{loading ? 'Connecting...' : 'Google'}</span>
                </button>
              </div>
            </form>
          )}

          {!showReset && !resetSent && (
            <div className="mt-8 pt-6 border-t border-surface-border text-center">
              <p className="text-slate-400 text-sm">
                Have an invite code?{' '}
                <Link to="/invite/code" className="text-primary-400 hover:text-primary-300 font-medium">
                  Join ConceptSHOP
                </Link>
              </p>
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
