const PENDING_ONBOARDING_KEY = 'conceptshop_pending_registration'

export const normalizeInviteCode = (code) => code?.trim().toUpperCase() || ''

export const readPendingOnboarding = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(PENDING_ONBOARDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Error reading pending onboarding:', error)
    return null
  }
}

export const writePendingOnboarding = (payload) => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(payload))
}

export const mergePendingOnboarding = (patch) => {
  const current = readPendingOnboarding() || {}
  writePendingOnboarding({ ...current, ...patch })
}

export const clearPendingOnboarding = () => {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PENDING_ONBOARDING_KEY)
}
