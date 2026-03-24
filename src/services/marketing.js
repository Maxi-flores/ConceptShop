import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Marketing analytics and campaign management

const campaignsCollection = collection(db, 'campaigns')
const analyticsCollection = collection(db, 'marketingAnalytics')
const conversionEventsCollection = collection(db, 'conversionEvents')

// Create marketing campaign
export const createCampaign = async (campaignData) => {
  try {
    const campaignRef = await addDoc(campaignsCollection, {
      ...campaignData,
      status: 'draft',
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        spend: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return campaignRef.id
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw error
  }
}

// Update campaign status
export const updateCampaignStatus = async (campaignId, status) => {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId)
    await updateDoc(campaignRef, {
      status,
      [`${status}At`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating campaign status:', error)
    throw error
  }
}

// Track campaign impression
export const trackImpression = async (campaignId, source = 'web') => {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId)
    await updateDoc(campaignRef, {
      'metrics.impressions': increment(1),
      updatedAt: serverTimestamp()
    })

    await addDoc(analyticsCollection, {
      campaignId,
      type: 'impression',
      source,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error tracking impression:', error)
  }
}

// Track campaign click
export const trackClick = async (campaignId, source = 'web', metadata = {}) => {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId)
    await updateDoc(campaignRef, {
      'metrics.clicks': increment(1),
      updatedAt: serverTimestamp()
    })

    await addDoc(analyticsCollection, {
      campaignId,
      type: 'click',
      source,
      metadata,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error tracking click:', error)
  }
}

// Track conversion
export const trackConversion = async (campaignId, orderId, revenue, userId = null) => {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId)
    await updateDoc(campaignRef, {
      'metrics.conversions': increment(1),
      'metrics.revenue': increment(revenue),
      updatedAt: serverTimestamp()
    })

    await addDoc(conversionEventsCollection, {
      campaignId,
      orderId,
      revenue,
      userId,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error tracking conversion:', error)
  }
}

// Subscribe to campaigns
export const subscribeToCampaigns = (callback, filters = {}) => {
  let q = query(campaignsCollection, orderBy('createdAt', 'desc'))

  if (filters.status) {
    q = query(q, where('status', '==', filters.status))
  }

  return onSnapshot(q, (snapshot) => {
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(campaigns)
  })
}

// Get campaign analytics
export const getCampaignAnalytics = async (campaignId, startDate, endDate) => {
  try {
    const q = query(
      analyticsCollection,
      where('campaignId', '==', campaignId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'asc')
    )

    const snapshot = await getDocs(q)
    const events = snapshot.docs.map(doc => doc.data())

    // Aggregate by day
    const dailyStats = {}
    events.forEach(event => {
      const date = event.timestamp?.toDate().toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { impressions: 0, clicks: 0, conversions: 0 }
      }
      dailyStats[date][`${event.type}s`] = (dailyStats[date][`${event.type}s`] || 0) + 1
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions * 100) : 0,
      conversionRate: stats.clicks > 0 ? (stats.conversions / stats.clicks * 100) : 0
    }))
  } catch (error) {
    console.error('Error getting campaign analytics:', error)
    throw error
  }
}

// Calculate ROI metrics
export const calculateROI = async (campaignId) => {
  try {
    const campaignDoc = await getDoc(doc(db, 'campaigns', campaignId))

    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found')
    }

    const campaign = campaignDoc.data()
    const metrics = campaign.metrics

    const roi = metrics.spend > 0
      ? ((metrics.revenue - metrics.spend) / metrics.spend * 100)
      : 0

    const ctr = metrics.impressions > 0
      ? (metrics.clicks / metrics.impressions * 100)
      : 0

    const conversionRate = metrics.clicks > 0
      ? (metrics.conversions / metrics.clicks * 100)
      : 0

    const cpa = metrics.conversions > 0
      ? (metrics.spend / metrics.conversions)
      : 0

    const roas = metrics.spend > 0
      ? (metrics.revenue / metrics.spend)
      : 0

    return {
      roi: Math.round(roi * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      totalRevenue: metrics.revenue,
      totalSpend: metrics.spend,
      totalConversions: metrics.conversions
    }
  } catch (error) {
    console.error('Error calculating ROI:', error)
    throw error
  }
}

// Get aggregate marketing stats
export const getMarketingOverview = async (startDate, endDate) => {
  try {
    // Get all campaigns in date range
    const campaignsQuery = query(
      campaignsCollection,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    )

    const campaignsSnapshot = await getDocs(campaignsQuery)

    const overview = {
      totalCampaigns: campaignsSnapshot.size,
      activeCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalSpend: 0,
      avgROI: 0,
      avgCTR: 0,
      avgConversionRate: 0,
      topCampaigns: []
    }

    const campaignData = []

    campaignsSnapshot.docs.forEach(doc => {
      const campaign = doc.data()
      const metrics = campaign.metrics || {}

      if (campaign.status === 'active') overview.activeCampaigns++

      overview.totalImpressions += metrics.impressions || 0
      overview.totalClicks += metrics.clicks || 0
      overview.totalConversions += metrics.conversions || 0
      overview.totalRevenue += metrics.revenue || 0
      overview.totalSpend += metrics.spend || 0

      campaignData.push({
        id: doc.id,
        name: campaign.name,
        revenue: metrics.revenue || 0,
        conversions: metrics.conversions || 0,
        roi: metrics.spend > 0 ? ((metrics.revenue - metrics.spend) / metrics.spend * 100) : 0
      })
    })

    // Calculate averages
    overview.avgCTR = overview.totalImpressions > 0
      ? (overview.totalClicks / overview.totalImpressions * 100)
      : 0

    overview.avgConversionRate = overview.totalClicks > 0
      ? (overview.totalConversions / overview.totalClicks * 100)
      : 0

    overview.avgROI = overview.totalSpend > 0
      ? ((overview.totalRevenue - overview.totalSpend) / overview.totalSpend * 100)
      : 0

    // Top campaigns by revenue
    overview.topCampaigns = campaignData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return overview
  } catch (error) {
    console.error('Error getting marketing overview:', error)
    throw error
  }
}

// Generate UTM tracking URL
export const generateTrackingUrl = (baseUrl, campaignId, source, medium, content = '') => {
  const url = new URL(baseUrl)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', medium)
  url.searchParams.set('utm_campaign', campaignId)
  if (content) url.searchParams.set('utm_content', content)
  return url.toString()
}

// Parse UTM parameters from URL
export const parseUTMParams = (url) => {
  try {
    const urlObj = new URL(url)
    return {
      source: urlObj.searchParams.get('utm_source'),
      medium: urlObj.searchParams.get('utm_medium'),
      campaign: urlObj.searchParams.get('utm_campaign'),
      content: urlObj.searchParams.get('utm_content')
    }
  } catch {
    return null
  }
}

// Stakeholder referral tracking
export const createReferralLink = async (stakeholderId, campaignId = null) => {
  try {
    const referralCode = `REF-${stakeholderId.slice(0, 8).toUpperCase()}`
    const baseUrl = import.meta.env.VITE_APP_DOMAIN || 'conceptshop.com'

    const referralDoc = await addDoc(collection(db, 'referrals'), {
      stakeholderId,
      code: referralCode,
      campaignId,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: serverTimestamp()
    })

    return {
      id: referralDoc.id,
      code: referralCode,
      url: `https://${baseUrl}/join?ref=${referralCode}`
    }
  } catch (error) {
    console.error('Error creating referral link:', error)
    throw error
  }
}

// Track referral
export const trackReferral = async (referralCode, type, value = 0) => {
  try {
    const referralQuery = query(
      collection(db, 'referrals'),
      where('code', '==', referralCode)
    )

    const snapshot = await getDocs(referralQuery)
    if (snapshot.empty) return

    const referralDoc = snapshot.docs[0]
    const updateData = { updatedAt: serverTimestamp() }

    if (type === 'click') {
      updateData.clicks = increment(1)
    } else if (type === 'conversion') {
      updateData.conversions = increment(1)
      updateData.revenue = increment(value)
    }

    await updateDoc(referralDoc.ref, updateData)
  } catch (error) {
    console.error('Error tracking referral:', error)
  }
}
