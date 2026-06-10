export const LICENSE_PLANS = [
  {
    id: 'free_startup',
    title: 'Starter',
    price: 'EUR0/month',
    priceDisplay: '€0/month',
    details: '1 admin, basic workspace, starter features',
    description: 'Perfect for exploring ConceptSHOP and launching your first workspace.',
    billingStatus: 'free',
    memberLimit: 0,
    badge: 'Launch for free',
    requiresPayment: false
  },
  {
    id: 'admin_monthly',
    title: 'Team',
    price: 'EUR6/month',
    priceDisplay: '€6/month',
    details: '1 admin, up to 2 team members, collaboration tools',
    description: 'For growing teams that need collaboration.',
    billingStatus: 'pending_payment',
    memberLimit: 2,
    badge: 'Monthly billing',
    requiresPayment: true
  },
  {
    id: 'admin_yearly',
    title: 'Business',
    price: 'EUR60/year',
    priceDisplay: '€60/year',
    details: '1 admin, up to 2 team members, annual billing savings',
    description: 'Lower annual cost for long-term growth.',
    billingStatus: 'pending_payment',
    memberLimit: 2,
    badge: 'Save €12',
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
  if (licensePlan === 'admin_monthly' || licensePlan === 'admin_yearly') {
    return licensePlan
  }

  return 'free_startup'
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
