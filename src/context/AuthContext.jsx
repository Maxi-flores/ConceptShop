import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  completeGoogleRedirectOnboarding,
  completePasswordReset,
  createAccountWithEmail,
  createAccountWithGoogle,
  getUserProfile,
  logOut,
  resetPassword,
  signIn,
  signInWithGoogle,
  verifyResetCode
} from '../firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)

      try {
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const userRecord = await signIn(email, password)
      const userProfile = await getUserProfile(userRecord.uid)
      setProfile(userProfile)
      return userRecord
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const loginWithGoogle = async () => {
    setError(null)
    try {
      const userRecord = await signInWithGoogle()
      const userProfile = await getUserProfile(userRecord.uid)

      if (!userProfile) {
        await logOut().catch(() => {})
        throw new Error('This Google account is not registered yet. Please create an account or join with an invite code.')
      }

      setProfile(userProfile)
      return userRecord
    } catch (err) {
      console.error('Google login failed:', err)
      setError(err.message)
      throw err
    }
  }

  const register = async (options) => {
    setError(null)
    try {
      const { user: createdUser } = await createAccountWithEmail(options)
      const userProfile = await getUserProfile(createdUser.uid)
      setProfile(userProfile)
      return createdUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const registerWithGoogle = async (options) => {
    setError(null)
    try {
      const createdUser = await createAccountWithGoogle(options)
      if (!createdUser) {
        return null
      }

      const userProfile = await getUserProfile(createdUser.uid)
      setProfile(userProfile)
      return createdUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const finishGoogleRedirectOnboarding = async (overrides) => {
    setError(null)
    try {
      const redirectedUser = await completeGoogleRedirectOnboarding(overrides)
      if (!redirectedUser) {
        return null
      }

      const userProfile = await getUserProfile(redirectedUser.uid)
      setProfile(userProfile)
      return redirectedUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await logOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const sendResetEmail = async (email) => {
    setError(null)
    try {
      await resetPassword(email)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const validateResetCode = async (code) => {
    setError(null)
    try {
      return await verifyResetCode(code)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const confirmResetPassword = async (code, newPassword) => {
    setError(null)
    try {
      await completePasswordReset(code, newPassword)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    registerWithGoogle,
    finishGoogleRedirectOnboarding,
    logout,
    sendResetEmail,
    validateResetCode,
    confirmResetPassword,
    hasProfileAccess: Boolean(profile),
    isAdmin: profile?.role === 'admin',
    isStakeholder: profile?.role === 'stakeholder' || profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
