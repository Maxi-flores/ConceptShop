export const LICENSE_PLANS = [
  {
    id: 'starter',
    title: 'Basic',
    price: 'EUR0/month',
    priceDisplay: '€0/month',
    details: '1 admin, up to 2 members, all prices exclude VAT',
    description: 'A lightweight starting point for invite-only workspaces.',
    billingStatus: 'free',
    memberLimit: 2,
    badge: 'Basic • 2 Members',
    requiresPayment: false
  },
  {
    id: 'premium',
    title: 'Premium',
    price: 'EUR6/month',
    priceDisplay: '€6/month',
    details: '1 admin, up to 5 members, all prices exclude VAT',
    description: 'For growing teams that need more room for members and workflows.',
    billingStatus: 'pending_payment',
    memberLimit: 5,
    badge: 'Premium • 5 Members',
    requiresPayment: true
  },
  {
    id: 'pro',
    title: 'Pro',
    price: 'EUR60/year',
    priceDisplay: '€60/year',
    details: '1 admin, unlimited members, all prices exclude VAT',
    description: 'The most flexible tier for larger workspaces and scale.',
    billingStatus: 'pending_payment',
    memberLimit: -1,
    badge: 'Pro • Unlimited Members',
    requiresPayment: true
  }
]

export const PAYMENT_METHODS = [
  {
    id: 'card',
    title: 'Credit Card',
    description: 'Fastest option once card billing is connected.'
  },
  {
    id: 'paypal',
    title: 'PayPal',
    description: 'A familiar online checkout option for many customers.'
  },
  {
    id: 'bank_transfer',
    title: 'Bank Transfer',
    description: 'Placeholder option for manual settlement or invoicing.'
  }
]

export const BUILDING_OPTIONS = [
  {
    id: 'online_store',
    title: 'Online Store',
    description: 'Sell products, services, subscriptions, or digital goods.'
  },
  {
    id: 'client_portal',
    title: 'Client Portal',
    description: 'Give customers access to projects, communication, files, and updates.'
  },
  {
    id: 'business_workspace',
    title: 'Business Workspace',
    description: 'Manage operations, workflows, team members, and automation.'
  },
  {
    id: 'custom_platform',
    title: 'Custom Platform',
    description: 'Build a tailored solution with integrations, CRM connections, and infrastructure support.'
  }
]

export const normalizeLicensePlan = (licensePlan) => {
  if (licensePlan === 'starter' || licensePlan === 'free' || licensePlan === 'free_startup') {
    return 'starter'
  }

  if (licensePlan === 'premium' || licensePlan === 'team_monthly' || licensePlan === 'admin_monthly') {
    return 'premium'
  }

  if (licensePlan === 'pro' || licensePlan === 'business_yearly' || licensePlan === 'admin_yearly') {
    return 'pro'
  }

  return 'starter'
}

export const getPlanById = (licensePlan) => {
  const normalized = normalizeLicensePlan(licensePlan)
  return LICENSE_PLANS.find((plan) => plan.id === normalized) || LICENSE_PLANS[0]
}

export const getLicenseMeta = (licensePlan) => {
  const plan = getPlanById(licensePlan)

  return {
    billingStatus: plan.billingStatus,
    memberLimit: plan.memberLimit,
    requiresPayment: plan.requiresPayment
  }
}

export const planRequiresPayment = (licensePlan) => getPlanById(licensePlan).requiresPayment

export const normalizeWorkspaceFocus = (workspaceFocus) => {
  const valid = BUILDING_OPTIONS.some((option) => option.id === workspaceFocus)
  return valid ? workspaceFocus : 'online_store'
}
