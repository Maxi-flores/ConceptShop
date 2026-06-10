import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  getUserProfile,
  signIn,
  signInWithGoogle,
  logOut,
  signUpWithInvite,
  resetPassword,
  verifyResetCode,
  completePasswordReset
} from '../firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const userProfile = await getUserProfile(firebaseUser.uid)
          setProfile(userProfile)
        } catch (err) {
          console.error('Error fetching profile:', err)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const user = await signIn(email, password)
      const userProfile = await getUserProfile(user.uid)
      setProfile(userProfile)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const loginWithGoogle = async () => {
    setError(null)
    try {
      const user = await signInWithGoogle()
      const userProfile = await getUserProfile(user.uid)
      setProfile(userProfile)
      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const register = async (email, password, fullName, inviteCode) => {
    setError(null)
    try {
      const { user } = await signUpWithInvite(email, password, fullName, inviteCode)
      const userProfile = await getUserProfile(user.uid)
      setProfile(userProfile)
      return user
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
    logout,
    sendResetEmail,
    validateResetCode,
    confirmResetPassword,
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
