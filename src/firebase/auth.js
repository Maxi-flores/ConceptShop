import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  verifyPasswordResetCode,
  confirmPasswordReset,
  GoogleAuthProvider
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

const getPasswordResetUrl = () => {
  const configuredDomain = import.meta.env.VITE_APP_DOMAIN?.trim()
  const normalizedConfiguredDomain = configuredDomain
    ? configuredDomain.replace(/\/+$/, '')
    : null

  if (normalizedConfiguredDomain) {
    const baseUrl = /^https?:\/\//i.test(normalizedConfiguredDomain)
      ? normalizedConfiguredDomain
      : `https://${normalizedConfiguredDomain}`

    return `${baseUrl}/login`
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/login`
  }

  return undefined
}

// Generate unique invite code
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'CS-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Validate invite code
export const validateInviteCode = async (code) => {
  try {
    const invitesRef = collection(db, 'inviteCodes')
    const q = query(invitesRef, where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid invite code' }
    }

    const inviteDoc = snapshot.docs[0]
    const inviteData = inviteDoc.data()

    if (inviteData.used) {
      return { valid: false, error: 'Invite code has already been used' }
    }

    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      return { valid: false, error: 'Invite code has expired' }
    }

    if (inviteData.maxUses && inviteData.useCount >= inviteData.maxUses) {
      return { valid: false, error: 'Invite code usage limit reached' }
    }

    return { valid: true, inviteId: inviteDoc.id, inviteData }
  } catch (error) {
    console.error('Error validating invite code:', error)
    return { valid: false, error: 'Error validating invite code' }
  }
}

// Sign up with invite code
export const signUpWithInvite = async (email, password, fullName, inviteCode) => {
  try {
    // Validate invite code first
    const validation = await validateInviteCode(inviteCode)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update display name
    await updateProfile(user, { displayName: fullName })

    // Create user document
    const userId = user.uid
    await setDoc(doc(db, 'users', userId), {
      uid: userId,
      email,
      fullName,
      role: validation.inviteData.assignedRole || 'stakeholder',
      invitedBy: validation.inviteData.createdBy || null,
      inviteCode: inviteCode.toUpperCase(),
      status: 'active',
      shares: {
        investment: 0,
        participation: 0,
        total: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create initial stakeholder record
    await setDoc(doc(db, 'stakeholders', userId), {
      userId,
      email,
      fullName,
      tier: 'bronze',
      investmentAmount: 0,
      orderContribution: 0,
      totalShares: 0,
      sharePercentage: 0,
      joinedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      status: 'active'
    })

    // Mark invite code as used (or increment use count)
    const inviteRef = doc(db, 'inviteCodes', validation.inviteId)
    if (validation.inviteData.maxUses > 1) {
      await updateDoc(inviteRef, {
        useCount: increment(1),
        lastUsedAt: serverTimestamp(),
        usedBy: [...(validation.inviteData.usedBy || []), userId]
      })
    } else {
      await updateDoc(inviteRef, {
        used: true,
        usedAt: serverTimestamp(),
        usedBy: userId
      })
    }

    return { user, userId }
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

// Sign in
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update last login
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    })

    return user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

const ensureUserDocuments = async (user, defaults = {}) => {
  const userRef = doc(db, 'users', user.uid)
  const stakeholderRef = doc(db, 'stakeholders', user.uid)

  const [userDoc, stakeholderDoc] = await Promise.all([
    getDoc(userRef),
    getDoc(stakeholderRef)
  ])

  const displayName = user.displayName || defaults.fullName || user.email?.split('@')[0] || 'User'
  const sharedProfile = {
    uid: user.uid,
    email: user.email || '',
    fullName: displayName,
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  }

  if (userDoc.exists()) {
    await setDoc(userRef, sharedProfile, { merge: true })
  } else {
    await setDoc(userRef, {
      ...sharedProfile,
      role: defaults.role || 'stakeholder',
      invitedBy: defaults.invitedBy || null,
      inviteCode: defaults.inviteCode || null,
      status: 'active',
      shares: {
        investment: 0,
        participation: 0,
        total: 0
      },
      createdAt: serverTimestamp()
    })
  }

  if (stakeholderDoc.exists()) {
    await setDoc(stakeholderRef, {
      email: user.email || '',
      fullName: displayName,
      lastActivityAt: serverTimestamp()
    }, { merge: true })
  } else {
    await setDoc(stakeholderRef, {
      userId: user.uid,
      email: user.email || '',
      fullName: displayName,
      tier: 'bronze',
      investmentAmount: 0,
      orderContribution: 0,
      totalShares: 0,
      sharePercentage: 0,
      joinedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      status: 'active'
    })
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    const user = userCredential.user

    await ensureUserDocuments(user)

    return user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    const passwordResetUrl = getPasswordResetUrl()

    await sendPasswordResetEmail(auth, email, passwordResetUrl
      ? {
          url: passwordResetUrl,
          handleCodeInApp: true
        }
      : undefined)
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error
  }
}

export const verifyResetCode = async (code) => {
  try {
    return await verifyPasswordResetCode(auth, code)
  } catch (error) {
    console.error('Error verifying reset code:', error)
    throw error
  }
}

export const completePasswordReset = async (code, newPassword) => {
  try {
    await confirmPasswordReset(auth, code, newPassword)
  } catch (error) {
    console.error('Error completing password reset:', error)
    throw error
  }
}

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

// Create invite code (admin only)
export const createInviteCode = async (creatorId, options = {}) => {
  try {
    const code = generateInviteCode()
    const inviteRef = doc(collection(db, 'inviteCodes'))

    await setDoc(inviteRef, {
      code,
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      used: false,
      useCount: 0,
      maxUses: options.maxUses || 1,
      assignedRole: options.role || 'stakeholder',
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn)
        : null,
      note: options.note || ''
    })

    return code
  } catch (error) {
    console.error('Error creating invite code:', error)
    throw error
  }
}
