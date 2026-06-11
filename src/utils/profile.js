import { normalizeLicensePlan } from '../config/plans'

const normalizeMap = (value, fallback = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback }
  }

  return { ...fallback, ...value }
}

export const normalizeUserProfile = (profile = {}) => {
  const safeProfile = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {}
  const completedTutorials = normalizeMap(safeProfile.completedTutorials, {})
  const emailPipeline = normalizeMap(safeProfile.emailPipeline, {})
  const integrations = normalizeMap(safeProfile.integrations, {})
  const paymentMethodSummary = normalizeMap(safeProfile.paymentMethodSummary, {})
  const normalizedPlan = normalizeLicensePlan(safeProfile.licensePlan)
  const defaultBillingStatus = normalizedPlan === 'starter' ? 'free' : 'pending_payment'
  const defaultMemberLimit = normalizedPlan === 'starter' ? 2 : normalizedPlan === 'premium' ? 5 : normalizedPlan === 'pro' ? -1 : 2

  return {
    ...safeProfile,
    uid: safeProfile.uid || safeProfile.id || '',
    email: safeProfile.email || '',
    displayName: safeProfile.displayName || safeProfile.fullName || '',
    photoURL: safeProfile.photoURL || null,
    authProvider: safeProfile.authProvider || 'password',
    role: safeProfile.role === 'member' ? 'member' : 'admin',
    platformRole: safeProfile.platformRole === 'platform_admin' ? 'platform_admin' : 'user',
    licensePlan: normalizedPlan,
    billingStatus: safeProfile.billingStatus || defaultBillingStatus,
    memberLimit: Number.isFinite(safeProfile.memberLimit) && safeProfile.memberLimit !== 0 ? safeProfile.memberLimit : defaultMemberLimit,
    onboardingCompleted: Boolean(safeProfile.onboardingCompleted),
    completedTutorials,
    workspaceName: safeProfile.workspaceName || '',
    businessName: safeProfile.businessName || '',
    logoUrl: safeProfile.logoUrl || '',
    emailPipeline,
    integrations,
    paymentMethodSummary,
    createdAt: safeProfile.createdAt || null,
    updatedAt: safeProfile.updatedAt || null
  }
}

export const getUserDisplayName = (profile, user) => {
  const normalizedProfile = normalizeUserProfile(profile)
  const fromProfile = normalizedProfile.displayName?.trim()
  const fromAuth = user?.displayName?.trim()
  const fromEmail = user?.email?.trim()

  return fromProfile || fromAuth || fromEmail || ''
}

export const getUserEmail = (profile, user) => {
  const normalizedProfile = normalizeUserProfile(profile)
  return normalizedProfile.email || user?.email || ''
}

export const getAccountTierLabel = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Platform Admin'
  }

  if (normalizedProfile.licensePlan === 'premium') {
    return 'Premium'
  }

  if (normalizedProfile.licensePlan === 'pro') {
    return 'Pro'
  }

  return 'Basic'
}

export const getVisiblePlanLabel = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  if (normalizedProfile.licensePlan === 'premium') {
    return 'Premium'
  }

  if (normalizedProfile.licensePlan === 'pro') {
    return 'Pro'
  }

  return 'Basic'
}

export const getPlanBillingSummary = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Platform admin access'
  }

  if (normalizedProfile.licensePlan === 'premium') {
    return normalizedProfile.billingStatus === 'active' ? '€6/month active' : '€6/month pending payment'
  }

  if (normalizedProfile.licensePlan === 'pro') {
    return normalizedProfile.billingStatus === 'active' ? '€60/year active' : '€60/year pending payment'
  }

  return 'Free'
}

export const getWorkspaceDisplayName = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  return normalizedProfile.workspaceName || normalizedProfile.businessName || normalizedProfile.displayName || 'ConceptSHOP'
}

export const getWorkspaceBrandLogo = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  return normalizedProfile.logoUrl || ''
}

export const getAccountTierKey = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'platform_admin'
  }

  return normalizedProfile.licensePlan || 'starter'
}

export const getAccountTierDescription = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Platform admin'
  }

  if (normalizedProfile.licensePlan === 'premium' || normalizedProfile.licensePlan === 'pro') {
    return normalizedProfile.billingStatus === 'active' ? 'Paid plan active' : 'Paid plan pending'
  }

  return normalizedProfile.billingStatus === 'free' ? 'Basic account' : 'Basic account'
}

export const canManageInvites = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  if (normalizedProfile.platformRole === 'platform_admin') return true
  if (normalizedProfile.role !== 'admin') return false
  if (normalizedProfile.billingStatus === 'pending_payment') return false
  return normalizedProfile.memberLimit === -1 || Number.isFinite(normalizedProfile.memberLimit)
}

export const getInviteCapacityLabel = (profile, currentCount = 0) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Unlimited / admin override'
  }

  if (normalizedProfile.memberLimit === -1) {
    return `${currentCount}/∞`
  }

  const limit = Number.isFinite(normalizedProfile.memberLimit) ? normalizedProfile.memberLimit : 0
  return `${currentCount}/${limit}`
}

export const getInvitePermissionMessage = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return ''
  }

  if (normalizedProfile.role !== 'admin') {
    return 'Only admins can invite users.'
  }

  if (normalizedProfile.billingStatus === 'pending_payment') {
    return 'This plan is saved as pending payment. Activate billing before inviting team members.'
  }

  if (normalizedProfile.licensePlan === 'premium' || normalizedProfile.licensePlan === 'pro') {
    if (normalizedProfile.billingStatus !== 'active') {
      return 'Paid plans need an active billing status before invites are available.'
    }
  }

  return ''
}

export const getTutorialMap = () => ({
  dashboard: {
    title: 'Dashboard',
    description: 'This is your overview. Start here to track activity, alerts, and workspace status.'
  },
  products: {
    title: 'Products',
    description: 'Manage your products and the structure behind each custom shop offering.'
  },
  orders: {
    title: 'Orders',
    description: 'Keep orders, customers, and fulfillment actions in one place.'
  },
  stakeholders: {
    title: 'Customers / Stakeholders',
    description: 'View people, access levels, and workspace participants.'
  },
  'invite-members': {
    title: 'Invite Members',
    description: 'Invite teammates, manage access, and keep the workspace tightly controlled.'
  },
  marketing: {
    title: 'Marketing',
    description: 'Review campaigns, automation, and growth activity from here.'
  },
  forecasting: {
    title: 'Forecasting',
    description: 'Use this area for planning, prediction, and operational insight.'
  },
  shipping: {
    title: 'Shipping',
    description: 'Track shipping behavior, fulfillment status, and delivery options.'
  },
  stock: {
    title: 'Inventory',
    description: 'Monitor inventory levels and keep stock healthy.'
  },
  settings: {
    title: 'Settings',
    description: 'Adjust your account tier, display name, and workspace preferences.'
  }
})
