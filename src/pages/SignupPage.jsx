import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import AlertCard from '../components/auth/AlertCard'
import AccountOnboardingForm from '../components/auth/AccountOnboardingForm'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const navigate = useNavigate()
  const { finishGoogleRedirectOnboarding } = useAuth()
  const [loadingRedirect, setLoadingRedirect] = useState(true)
  const [redirectError, setRedirectError] = useState('')

  useEffect(() => {
    let active = true

    const hydrateGoogleRedirect = async () => {
      try {
        const redirectedUser = await finishGoogleRedirectOnboarding({ onboardingSource: 'signup' })
        if (!active) return

        if (redirectedUser) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch (error) {
        if (!active) return
        setRedirectError(error.message || 'Unable to finish Google account creation.')
      } finally {
        if (active) {
          setLoadingRedirect(false)
        }
      }
    }

    hydrateGoogleRedirect()

    return () => {
      active = false
    }
  }, [finishGoogleRedirectOnboarding, navigate])

  if (loadingRedirect) {
    return (
      <AuthShell maxWidth="max-w-xl">
        <div className="glass rounded-3xl p-10 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" />
          <p className="mt-6 text-slate-400">Preparing your ConceptSHOP workspace...</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="space-y-6">
        {redirectError && <AlertCard>{redirectError}</AlertCard>}

        <AccountOnboardingForm
          onboardingSource="signup"
          headerEyebrow="Create account"
          title="Create your ConceptSHOP workspace"
          description="Choose a plan, create your account with Google or email, and finish setup only if the plan needs payment."
        />
      </div>
    </AuthShell>
  )
}
