import { normalizeLicensePlan } from '../config/plans'

const normalizeMap = (value, fallback = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback }
  }

  return { ...fallback, ...value }
}

export const normalizeUserProfile = (profile = {}) => {
  const completedTutorials = normalizeMap(profile.completedTutorials, {})
  const emailPipeline = normalizeMap(profile.emailPipeline, {})
  const integrations = normalizeMap(profile.integrations, {})
  const paymentMethodSummary = normalizeMap(profile.paymentMethodSummary, {})

  return {
    ...profile,
    uid: profile.uid || profile.id || '',
    email: profile.email || '',
    displayName: profile.displayName || profile.fullName || '',
    photoURL: profile.photoURL || null,
    authProvider: profile.authProvider || 'password',
    role: profile.role === 'member' ? 'member' : 'admin',
    platformRole: profile.platformRole === 'platform_admin' ? 'platform_admin' : 'user',
    licensePlan: normalizeLicensePlan(profile.licensePlan),
    billingStatus: profile.billingStatus || 'free',
    memberLimit: Number.isFinite(profile.memberLimit) ? profile.memberLimit : 0,
    onboardingCompleted: Boolean(profile.onboardingCompleted),
    completedTutorials,
    workspaceName: profile.workspaceName || '',
    businessName: profile.businessName || '',
    logoUrl: profile.logoUrl || '',
    emailPipeline,
    integrations,
    paymentMethodSummary,
    createdAt: profile.createdAt || null,
    updatedAt: profile.updatedAt || null
  }
}

export const getUserDisplayName = (profile, user) => {
  const normalizedProfile = normalizeUserProfile(profile)
  const fromProfile = normalizedProfile.displayName?.trim()
  const fromAuth = user?.displayName?.trim()
  const fromEmail = user?.email?.trim()

  return fromProfile || fromAuth || fromEmail || 'ConceptSHOP'
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

  if (normalizedProfile.licensePlan === 'team_monthly') {
    return 'Team'
  }

  if (normalizedProfile.licensePlan === 'business_yearly') {
    return 'Business'
  }

  return 'Starter'
}

export const getVisiblePlanLabel = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  if (normalizedProfile.licensePlan === 'team_monthly') {
    return 'Premium'
  }

  if (normalizedProfile.licensePlan === 'business_yearly') {
    return 'Pro'
  }

  return 'Basic'
}

export const getPlanBillingSummary = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Platform admin access'
  }

  if (normalizedProfile.licensePlan === 'team_monthly') {
    return normalizedProfile.billingStatus === 'active' ? '€6/month active' : '€6/month pending'
  }

  if (normalizedProfile.licensePlan === 'business_yearly') {
    return normalizedProfile.billingStatus === 'active' ? '€60/year active' : '€60/year pending'
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

  if (normalizedProfile.licensePlan === 'team_monthly' || normalizedProfile.licensePlan === 'business_yearly') {
    return normalizedProfile.billingStatus === 'active' ? 'Premium active' : 'Premium pending'
  }

  return normalizedProfile.billingStatus === 'free' ? 'Starter account' : 'Basic account'
}

export const canManageInvites = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)
  if (normalizedProfile.platformRole === 'platform_admin') return true
  if (normalizedProfile.role !== 'admin') return false
  if (normalizedProfile.billingStatus !== 'active') return false
  return normalizedProfile.licensePlan === 'team_monthly' || normalizedProfile.licensePlan === 'business_yearly'
}

export const getInviteCapacityLabel = (profile, currentCount = 0) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return 'Unlimited / admin override'
  }

  if (normalizedProfile.licensePlan === 'team_monthly' || normalizedProfile.licensePlan === 'business_yearly') {
    return `${currentCount}/2`
  }

  return '0/0'
}

export const getInvitePermissionMessage = (profile) => {
  const normalizedProfile = normalizeUserProfile(profile)

  if (normalizedProfile.platformRole === 'platform_admin') {
    return ''
  }

  if (normalizedProfile.role !== 'admin') {
    return 'Only admins can invite users.'
  }

  if (normalizedProfile.billingStatus !== 'active' || (normalizedProfile.licensePlan !== 'team_monthly' && normalizedProfile.licensePlan !== 'business_yearly')) {
    return 'Starter accounts cannot invite team members. Upgrade to Team or Business, or use a platform admin account.'
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
