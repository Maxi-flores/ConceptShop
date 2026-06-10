import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  increment,
  arrayUnion
} from 'firebase/firestore'
import { auth, db } from './config'
import { getLicenseMeta, normalizeLicensePlan, normalizeWorkspaceFocus } from '../config/plans'
import {
  clearPendingOnboarding,
  mergePendingOnboarding,
  normalizeInviteCode,
  readPendingOnboarding,
  writePendingOnboarding
} from '../utils/onboardingState'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

const MISSING_EMAIL_PROFILE_MESSAGE = 'This account is not registered yet. Please join ConceptSHOP with an invite code first.'
const MISSING_PROFILE_MESSAGE = 'This Google account is not registered yet. Please create an account or join with an invite code.'
const MISSING_ONBOARDING_MESSAGE = 'Your onboarding session has expired. Please restart account creation.'
const PROFILE_LOOKUP_TIMEOUT_MS = 8000
const PROFILE_UNAVAILABLE_MESSAGE = 'Google sign-in worked, but ConceptSHOP could not reach the profile database. Please refresh or try again.'

const friendlyAuthErrors = {
  'auth/unauthorized-domain': 'Google sign-in is not allowed from this domain yet. Add this site to the Firebase authorized domains list.',
  'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
  'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method. Try the matching provider or contact support.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Try again or use the redirect flow.',
  'auth/cancelled-popup-request': 'The Google sign-in popup was cancelled.',
  'auth/operation-not-supported-in-this-environment': 'Google sign-in is not supported in this environment.',
  'auth/network-request-failed': 'Network error while checking Google sign-in. Please try again.',
  'auth/profile-unavailable': PROFILE_UNAVAILABLE_MESSAGE,
  'auth/profile-timeout': PROFILE_UNAVAILABLE_MESSAGE,
  'auth/missing-profile-email': MISSING_EMAIL_PROFILE_MESSAGE,
  'auth/missing-profile': MISSING_PROFILE_MESSAGE,
  'auth/missing-onboarding': MISSING_ONBOARDING_MESSAGE
}

const getFriendlyErrorMessage = (error, fallback) => {
  if (!error) return fallback
  return friendlyAuthErrors[error.code] || error.message || fallback
}

const asFriendlyError = (error, fallback, code = error?.code) => {
  const friendlyError = new Error(getFriendlyErrorMessage(error, fallback))
  friendlyError.code = code
  return friendlyError
}

const logFirebaseError = (label, error) => {
  console.error(label, {
    code: error?.code,
    message: error?.message,
    error
  })
}

const isPermissionDeniedError = (error) => {
  return error?.code === 'permission-denied' || error?.code === 'auth/permission-denied'
}

const isOfflineLikeError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === 'unavailable' ||
    error?.code === 'deadline-exceeded' ||
    error?.code === 'auth/network-request-failed' ||
    message.includes('client is offline') ||
    message.includes('offline')
  )
}

const raceWithTimeout = (promise, timeoutMs, timeoutError) => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

const getInviteValidationError = (inviteData) => {
  if (!inviteData) {
    return 'Invalid invite code'
  }

  if (inviteData.used) {
    return 'Invite code has already been used'
  }

  if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
    return 'Invite code has expired'
  }

  const maxUses = Number(inviteData.maxUses || 1)
  const useCount = Number(inviteData.useCount || 0)
  if (useCount >= maxUses) {
    return 'Invite code has already been used'
  }

  return null
}

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

const normalizeOnboardingSource = (onboardingSource) => {
  return onboardingSource === 'invite' ? 'invite' : 'signup'
}

const getProviderLabel = (user, fallback) => {
  return user.providerData?.[0]?.providerId || fallback
}

const buildUserProfilePayload = ({
  user,
  inviteValidation,
  providerLabel,
  displayName,
  licensePlan,
  accountType,
  workspaceFocus,
  onboardingSource
}) => {
  const normalizedPlan = normalizeLicensePlan(licensePlan)
  const normalizedSource = normalizeOnboardingSource(onboardingSource)
  const normalizedWorkspaceFocus = normalizeWorkspaceFocus(workspaceFocus)
  const licenseMeta = getLicenseMeta(normalizedPlan)
  const resolvedDisplayName = displayName || user.displayName || user.email?.split('@')[0] || 'User'

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: resolvedDisplayName,
    fullName: resolvedDisplayName,
    authProvider: providerLabel,
    role: 'admin',
    accountType: accountType || 'company',
    workspaceFocus: normalizedWorkspaceFocus,
    licensePlan: normalizedPlan,
    billingStatus: licenseMeta.billingStatus,
    memberLimit: licenseMeta.memberLimit,
    inviteCode: inviteValidation?.inviteCode || null,
    onboardingSource: normalizedSource,
    photoURL: user.photoURL || null,
    inviteId: inviteValidation?.inviteId || null,
    invitedBy: inviteValidation?.inviteData?.createdBy || null,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProviders: user.providerData?.map((provider) => provider.providerId).filter(Boolean) || []
  }
}

const upsertUserProfile = async (profilePayload) => {
  const userRef = doc(db, 'users', profilePayload.uid)
  const userDoc = await getDoc(userRef)
  const payload = {
    ...profilePayload
  }

  if (!userDoc.exists()) {
    payload.createdAt = serverTimestamp()
  }

  await setDoc(userRef, payload, { merge: true })
}

const upsertStakeholderProfile = async (profilePayload) => {
  const stakeholderRef = doc(db, 'stakeholders', profilePayload.uid)
  const stakeholderDoc = await getDoc(stakeholderRef)

  const payload = {
    userId: profilePayload.uid,
    uid: profilePayload.uid,
    email: profilePayload.email,
    displayName: profilePayload.displayName,
    fullName: profilePayload.fullName,
    authProvider: profilePayload.authProvider,
    role: profilePayload.role,
    accountType: profilePayload.accountType,
    workspaceFocus: profilePayload.workspaceFocus,
    licensePlan: profilePayload.licensePlan,
    billingStatus: profilePayload.billingStatus,
    memberLimit: profilePayload.memberLimit,
    inviteCode: profilePayload.inviteCode,
    onboardingSource: profilePayload.onboardingSource,
    inviteId: profilePayload.inviteId,
    invitedBy: profilePayload.invitedBy,
    tier: stakeholderDoc.exists() ? stakeholderDoc.data().tier || 'bronze' : 'bronze',
    investmentAmount: stakeholderDoc.exists() ? stakeholderDoc.data().investmentAmount || 0 : 0,
    orderContribution: stakeholderDoc.exists() ? stakeholderDoc.data().orderContribution || 0 : 0,
    totalShares: stakeholderDoc.exists() ? stakeholderDoc.data().totalShares || 0 : 0,
    sharePercentage: stakeholderDoc.exists() ? stakeholderDoc.data().sharePercentage || 0 : 0,
    joinSource: profilePayload.onboardingSource,
    joinedAt: stakeholderDoc.exists() ? stakeholderDoc.data().joinedAt || serverTimestamp() : serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    createdAt: stakeholderDoc.exists() ? stakeholderDoc.data().createdAt || serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active'
  }

  await setDoc(stakeholderRef, payload, { merge: true })
}

const consumeInviteCode = async (inviteValidation, userId) => {
  if (!inviteValidation) return

  const inviteRef = doc(db, 'inviteCodes', inviteValidation.inviteId)
  const maxUses = Number(inviteValidation.inviteData.maxUses || 1)
  const currentUseCount = Number(inviteValidation.inviteData.useCount || 0)
  const nextUseCount = currentUseCount + 1
  const payload = {
    useCount: increment(1),
    lastUsedAt: serverTimestamp()
  }

  if (maxUses > 1) {
    payload.usedBy = arrayUnion(userId)
  } else {
    payload.usedBy = userId
  }

  if (nextUseCount >= maxUses) {
    payload.used = true
    payload.usedAt = serverTimestamp()
  }

  await updateDoc(inviteRef, payload)
}

const resolveInviteValidation = async (inviteCode, onboardingSource) => {
  if (normalizeOnboardingSource(onboardingSource) !== 'invite') {
    return null
  }

  const validation = await validateInviteCode(inviteCode)
  if (!validation.valid) {
    const error = new Error(validation.error)
    error.code = 'auth/invalid-invite'
    throw error
  }

  return validation
}

const provisionAccount = async ({
  user,
  displayName,
  providerLabel,
  licensePlan,
  accountType,
  workspaceFocus,
  onboardingSource,
  inviteValidation
}) => {
  const profilePayload = buildUserProfilePayload({
    user,
    inviteValidation,
    providerLabel,
    displayName,
    licensePlan,
    accountType,
    workspaceFocus,
    onboardingSource
  })

  await upsertUserProfile(profilePayload)
  await upsertStakeholderProfile(profilePayload)
  await consumeInviteCode(inviteValidation, user.uid)
}

const touchLastLogin = async (userId) => {
  await setDoc(doc(db, 'users', userId), {
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true })
}

const ensureExistingProfile = async (user, missingProfileMessage = MISSING_EMAIL_PROFILE_MESSAGE, code = 'auth/missing-profile-email') => {
  const profile = await getUserProfileWithTimeout(user.uid)

  if (!profile) {
    await signOut(auth).catch(() => {})
    throw asFriendlyError({ code }, missingProfileMessage, code)
  }

  await touchLastLogin(user.uid)
  return profile
}

const buildOnboardingPayload = (options) => ({
  onboardingSource: normalizeOnboardingSource(options.onboardingSource),
  inviteCode: normalizeInviteCode(options.inviteCode),
  licensePlan: normalizeLicensePlan(options.licensePlan),
  accountType: options.accountType || 'company',
  workspaceFocus: normalizeWorkspaceFocus(options.workspaceFocus),
  displayName: options.displayName?.trim() || '',
  paymentMethod: options.paymentMethod || null
})

const startGoogleRedirectOnboarding = async (options) => {
  writePendingOnboarding(buildOnboardingPayload(options))
  await signInWithRedirect(auth, googleProvider)
}

const completeGoogleProvisioning = async (user, options) => {
  const inviteValidation = await resolveInviteValidation(options.inviteCode, options.onboardingSource)

  await provisionAccount({
    user,
    displayName: options.displayName || user.displayName,
    providerLabel: getProviderLabel(user, 'google.com'),
    licensePlan: options.licensePlan,
    accountType: options.accountType,
    onboardingSource: options.onboardingSource,
    inviteValidation
  })
}

// Generate unique invite code
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'CS-'
  for (let index = 0; index < 8; index += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Validate invite code
export const validateInviteCode = async (code) => {
  try {
    const normalizedCode = normalizeInviteCode(code)
    if (!normalizedCode) {
      return { valid: false, error: 'Invalid invite code' }
    }

    const invitesRef = collection(db, 'inviteCodes')
    const inviteQuery = query(invitesRef, where('code', '==', normalizedCode))
    const snapshot = await getDocs(inviteQuery)

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid invite code' }
    }

    const inviteDoc = snapshot.docs[0]
    const inviteData = inviteDoc.data()
    const validationError = getInviteValidationError(inviteData)
    if (validationError) {
      return { valid: false, error: validationError }
    }

    return { valid: true, inviteId: inviteDoc.id, inviteCode: normalizedCode, inviteData }
  } catch (error) {
    console.error('Error validating invite code:', error)
    return { valid: false, error: 'Error validating invite code' }
  }
}

export const createAccountWithEmail = async ({
  email,
  password,
  displayName,
  licensePlan = 'free_startup',
  workspaceFocus = 'online_store',
  accountType = 'company',
  onboardingSource = 'signup',
  inviteCode = null,
  paymentMethod = null
}) => {
  let createdUser = null

  try {
    const normalizedOptions = buildOnboardingPayload({
      onboardingSource,
      inviteCode,
      licensePlan,
      workspaceFocus,
      accountType,
      displayName,
      paymentMethod
    })

    const inviteValidation = await resolveInviteValidation(normalizedOptions.inviteCode, normalizedOptions.onboardingSource)
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    createdUser = credential.user

    const resolvedDisplayName = displayName?.trim() || email?.split('@')[0] || 'User'
    await updateProfile(createdUser, { displayName: resolvedDisplayName })

    await provisionAccount({
      user: createdUser,
      displayName: resolvedDisplayName,
      providerLabel: 'password',
      licensePlan: normalizedOptions.licensePlan,
      workspaceFocus: normalizedOptions.workspaceFocus,
      accountType: normalizedOptions.accountType,
      onboardingSource: normalizedOptions.onboardingSource,
      inviteValidation
    })

    clearPendingOnboarding()
    return { user: createdUser, userId: createdUser.uid }
  } catch (error) {
    console.error('Error creating email account:', error)
    if (createdUser && auth.currentUser?.uid === createdUser.uid) {
      await signOut(auth).catch(() => {})
    }
    throw asFriendlyError(error, 'Failed to create account')
  }
}

export const createAccountWithGoogle = async ({
  displayName,
  licensePlan = 'free_startup',
  workspaceFocus = 'online_store',
  accountType = 'company',
  onboardingSource = 'signup',
  inviteCode = null,
  paymentMethod = null
}) => {
  let createdUser = null

  try {
    const normalizedOptions = buildOnboardingPayload({
      onboardingSource,
      inviteCode,
      licensePlan,
      workspaceFocus,
      accountType,
      displayName,
      paymentMethod
    })

    writePendingOnboarding(normalizedOptions)
    const credential = await signInWithPopup(auth, googleProvider)
    createdUser = credential.user

    await completeGoogleProvisioning(createdUser, normalizedOptions)
    clearPendingOnboarding()
    return createdUser
  } catch (error) {
    console.error('Error creating Google account:', error)

    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
      await startGoogleRedirectOnboarding({
        onboardingSource,
        inviteCode,
        licensePlan,
        workspaceFocus,
        accountType,
        displayName,
        paymentMethod
      })
      return null
    }

    if (createdUser && auth.currentUser?.uid === createdUser.uid) {
      await signOut(auth).catch(() => {})
    }

    throw asFriendlyError(error, 'Failed to create account with Google')
  }
}

export const completeGoogleRedirectOnboarding = async (overrides = {}) => {
  let redirectedUser = null

  try {
    const result = await getRedirectResult(auth)
    if (!result) {
      return null
    }

    redirectedUser = result.user
    const pending = readPendingOnboarding()
    const merged = buildOnboardingPayload({
      onboardingSource: overrides.onboardingSource || pending?.onboardingSource,
      inviteCode: overrides.inviteCode || pending?.inviteCode,
      licensePlan: overrides.licensePlan || pending?.licensePlan,
      workspaceFocus: overrides.workspaceFocus || pending?.workspaceFocus,
      accountType: overrides.accountType || pending?.accountType,
      displayName: overrides.displayName || pending?.displayName,
      paymentMethod: overrides.paymentMethod || pending?.paymentMethod
    })

    if (!pending?.onboardingSource && !overrides.onboardingSource) {
      await signOut(auth).catch(() => {})
      throw asFriendlyError({ code: 'auth/missing-onboarding' }, MISSING_ONBOARDING_MESSAGE)
    }

    await completeGoogleProvisioning(result.user, merged)
    clearPendingOnboarding()
    return result.user
  } catch (error) {
    console.error('Error completing Google redirect onboarding:', error)
    if (redirectedUser && auth.currentUser?.uid === redirectedUser.uid) {
      await signOut(auth).catch(() => {})
    }
    throw asFriendlyError(error, 'Failed to finish Google registration')
  }
}

// Backward-compatible wrappers
export const signUpWithInvite = async (email, password, fullName, inviteCode, licensePlan = 'free_startup') => {
  return createAccountWithEmail({
    email,
    password,
    displayName: fullName,
    inviteCode,
    licensePlan,
    onboardingSource: 'invite',
    workspaceFocus: 'online_store',
    accountType: 'company'
  })
}

export const registerWithGoogle = async (inviteCode, licensePlan = 'free_startup', fullName) => {
  return createAccountWithGoogle({
    displayName: fullName,
    inviteCode,
    licensePlan,
    onboardingSource: 'invite',
    workspaceFocus: 'online_store',
    accountType: 'company'
  })
}

export const completeGoogleRedirectRegistration = async (inviteCode) => {
  return completeGoogleRedirectOnboarding({ onboardingSource: 'invite', inviteCode })
}

// Sign in
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await ensureExistingProfile(userCredential.user, MISSING_EMAIL_PROFILE_MESSAGE, 'auth/missing-profile-email')
    return userCredential.user
  } catch (error) {
    logFirebaseError('Error signing in:', error)
    throw asFriendlyError(error, 'Failed to sign in')
  }
}

// Sign in with Google for existing users
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    const userProfile = await getUserProfileWithTimeout(userCredential.user.uid)

    if (!userProfile) {
      await signOut(auth).catch(() => {})
      throw asFriendlyError({ code: 'auth/missing-profile' }, MISSING_PROFILE_MESSAGE, 'auth/missing-profile')
    }

    return { user: userCredential.user, profile: userProfile }
  } catch (error) {
    logFirebaseError('Error signing in with Google:', error)
    throw asFriendlyError(error, 'Failed to sign in with Google')
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
    logFirebaseError('Error getting user profile:', error)
    const code = error?.code || error?.name

    if (code === 'permission-denied') {
      throw asFriendlyError(
        { code: 'permission-denied' },
        'Firestore permission denied while reading your profile. Please try again or contact support.',
        'permission-denied'
      )
    }

    if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'auth/network-request-failed') {
      throw asFriendlyError(
        { code: 'auth/network-request-failed' },
        'Network error while reading your Firestore profile. Please try again.',
        'auth/network-request-failed'
      )
    }

    throw asFriendlyError(error, 'Failed to read your Firestore profile. Please try again.', code)
  }
}

export const getUserProfileWithTimeout = async (userId, timeoutMs = PROFILE_LOOKUP_TIMEOUT_MS) => {
  const timeoutError = asFriendlyError(
    { code: 'auth/profile-timeout' },
    PROFILE_UNAVAILABLE_MESSAGE,
    'auth/profile-timeout'
  )

  try {
    const profile = await raceWithTimeout(getUserProfile(userId), timeoutMs, timeoutError)
    return profile
  } catch (error) {
    logFirebaseError('Error reading user profile with timeout:', error)

    if (error?.code === 'auth/profile-timeout' || isOfflineLikeError(error)) {
      throw asFriendlyError({ code: 'auth/profile-unavailable' }, PROFILE_UNAVAILABLE_MESSAGE, 'auth/profile-unavailable')
    }

    if (isPermissionDeniedError(error)) {
      throw asFriendlyError(
        { code: 'permission-denied' },
        'Firestore permission denied while reading your profile. Please check your Firestore rules and try again.',
        'permission-denied'
      )
    }

    throw error
  }
}

export const retryCurrentProfileLookup = async (timeoutMs = PROFILE_LOOKUP_TIMEOUT_MS) => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw asFriendlyError({ code: 'auth/no-current-user' }, 'No authenticated user is available for profile lookup.', 'auth/no-current-user')
  }

  return getUserProfileWithTimeout(currentUser.uid, timeoutMs)
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

export const pendingOnboarding = {
  read: readPendingOnboarding,
  write: writePendingOnboarding,
  merge: mergePendingOnboarding,
  clear: clearPendingOnboarding
}
