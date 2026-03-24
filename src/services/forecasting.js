import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Price forecasting service combining bulk pricing and market trends

// Historical data collection
const priceHistoryCollection = collection(db, 'priceHistory')
const marketTrendsCollection = collection(db, 'marketTrends')

// Record price point for historical analysis
export const recordPricePoint = async (productId, price, quantity, source = 'order') => {
  try {
    await addDoc(priceHistoryCollection, {
      productId,
      price,
      quantity,
      source, // 'order', 'market', 'competitor'
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error recording price point:', error)
  }
}

// Get historical prices for a product
export const getHistoricalPrices = async (productId, days = 90) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const q = query(
      priceHistoryCollection,
      where('productId', '==', productId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'asc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
  } catch (error) {
    console.error('Error getting historical prices:', error)
    return []
  }
}

// Simple linear regression for trend analysis
const linearRegression = (data) => {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0]?.y || 0, r2: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

  data.forEach((point, i) => {
    const x = i
    const y = point.y
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  let ssRes = 0, ssTot = 0
  data.forEach((point, i) => {
    const yPred = slope * i + intercept
    ssRes += Math.pow(point.y - yPred, 2)
    ssTot += Math.pow(point.y - yMean, 2)
  })
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot)

  return { slope, intercept, r2 }
}

// Moving average calculation
const movingAverage = (data, window = 7) => {
  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const subset = data.slice(start, i + 1)
    const avg = subset.reduce((sum, d) => sum + d.y, 0) / subset.length
    result.push({ x: data[i].x, y: avg })
  }
  return result
}

// Calculate bulk pricing discount
export const calculateBulkDiscount = (basePrice, quantity, bulkTiers) => {
  if (!bulkTiers || bulkTiers.length === 0) {
    return { price: basePrice, discount: 0, tier: null }
  }

  const applicableTier = bulkTiers
    .filter(tier => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]

  if (!applicableTier) {
    return { price: basePrice, discount: 0, tier: null }
  }

  let discountedPrice
  if (applicableTier.discountType === 'percentage') {
    discountedPrice = basePrice * (1 - applicableTier.discount / 100)
  } else {
    discountedPrice = basePrice - applicableTier.discount
  }

  return {
    price: Math.round(discountedPrice * 100) / 100,
    discount: applicableTier.discount,
    discountType: applicableTier.discountType,
    tier: applicableTier
  }
}

// Forecast future prices based on trends
export const forecastPrices = async (productId, forecastDays = 30) => {
  try {
    const historicalData = await getHistoricalPrices(productId, 90)

    if (historicalData.length < 5) {
      return {
        success: false,
        message: 'Insufficient historical data for forecasting',
        data: null
      }
    }

    // Prepare data for analysis
    const priceData = historicalData.map((point, i) => ({
      x: i,
      y: point.price,
      date: point.timestamp
    }))

    // Calculate trend
    const regression = linearRegression(priceData)
    const ma7 = movingAverage(priceData, 7)
    const ma30 = movingAverage(priceData, 30)

    // Generate forecast
    const lastIndex = priceData.length - 1
    const forecast = []
    const lastDate = priceData[lastIndex].date || new Date()

    for (let i = 1; i <= forecastDays; i++) {
      const predictedPrice = regression.slope * (lastIndex + i) + regression.intercept
      const forecastDate = new Date(lastDate)
      forecastDate.setDate(forecastDate.getDate() + i)

      forecast.push({
        day: i,
        date: forecastDate,
        predictedPrice: Math.max(0, Math.round(predictedPrice * 100) / 100),
        confidence: Math.max(0, Math.min(100, (regression.r2 * 100) - (i * 0.5))) // Decreasing confidence over time
      })
    }

    // Determine trend direction
    let trendDirection = 'stable'
    if (regression.slope > 0.01) trendDirection = 'increasing'
    else if (regression.slope < -0.01) trendDirection = 'decreasing'

    // Calculate volatility
    const priceChanges = priceData.slice(1).map((p, i) =>
      Math.abs((p.y - priceData[i].y) / priceData[i].y)
    )
    const avgVolatility = priceChanges.length > 0
      ? priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length
      : 0

    return {
      success: true,
      data: {
        historical: priceData,
        movingAverage7: ma7,
        movingAverage30: ma30,
        forecast,
        analysis: {
          trend: trendDirection,
          slope: regression.slope,
          confidence: regression.r2 * 100,
          volatility: avgVolatility * 100,
          currentPrice: priceData[lastIndex].y,
          predictedPrice30Days: forecast[forecastDays - 1]?.predictedPrice,
          priceChange30Days: forecast[forecastDays - 1]
            ? ((forecast[forecastDays - 1].predictedPrice - priceData[lastIndex].y) / priceData[lastIndex].y * 100)
            : 0
        }
      }
    }
  } catch (error) {
    console.error('Error forecasting prices:', error)
    return {
      success: false,
      message: 'Error generating forecast',
      error: error.message
    }
  }
}

// Calculate optimal group order timing
export const calculateOptimalOrderTiming = async (productId, targetQuantity) => {
  try {
    const forecast = await forecastPrices(productId)

    if (!forecast.success) {
      return { recommendation: 'order_now', reason: 'Insufficient data for analysis' }
    }

    const { analysis, forecast: forecastData } = forecast.data

    // If prices are increasing, order sooner
    if (analysis.trend === 'increasing') {
      return {
        recommendation: 'order_now',
        reason: 'Prices are trending upward',
        potentialSavings: analysis.priceChange30Days,
        confidence: analysis.confidence
      }
    }

    // If prices are decreasing, find the optimal point
    if (analysis.trend === 'decreasing') {
      const lowestPoint = forecastData.reduce((min, curr) =>
        curr.predictedPrice < min.predictedPrice ? curr : min
      )

      return {
        recommendation: 'wait',
        optimalDate: lowestPoint.date,
        daysToWait: lowestPoint.day,
        reason: 'Prices are trending downward',
        potentialSavings: ((analysis.currentPrice - lowestPoint.predictedPrice) / analysis.currentPrice * 100),
        confidence: lowestPoint.confidence
      }
    }

    // Stable prices - consider bulk discount impact
    return {
      recommendation: 'order_now',
      reason: 'Prices are stable - bulk discounts make ordering now beneficial',
      confidence: analysis.confidence
    }
  } catch (error) {
    console.error('Error calculating optimal timing:', error)
    return { recommendation: 'order_now', reason: 'Error in analysis' }
  }
}

// Analyze market competitiveness
export const analyzeMarketPosition = async (productId, currentPrice) => {
  try {
    // In production, this would fetch competitor prices from market data
    // For now, we'll use simulated market data

    const marketSnapshot = {
      averageMarketPrice: currentPrice * 1.1,
      lowestPrice: currentPrice * 0.95,
      highestPrice: currentPrice * 1.3,
      numberOfCompetitors: 8,
      priceRank: 2 // 1 = lowest
    }

    const competitiveness = ((marketSnapshot.averageMarketPrice - currentPrice) / marketSnapshot.averageMarketPrice * 100)

    return {
      marketData: marketSnapshot,
      analysis: {
        competitiveness: competitiveness,
        recommendation: competitiveness > 10 ? 'competitive' : competitiveness > 0 ? 'average' : 'above_market',
        priceDifferenceFromAverage: marketSnapshot.averageMarketPrice - currentPrice,
        percentBelowAverage: competitiveness
      }
    }
  } catch (error) {
    console.error('Error analyzing market position:', error)
    throw error
  }
}

// Generate pricing report
export const generatePricingReport = async (productId) => {
  try {
    const [forecast, marketPosition] = await Promise.all([
      forecastPrices(productId),
      analyzeMarketPosition(productId, 100) // Would use actual current price
    ])

    return {
      productId,
      generatedAt: new Date(),
      forecast: forecast.success ? forecast.data : null,
      marketPosition,
      recommendations: [
        forecast.success && forecast.data.analysis.trend === 'decreasing'
          ? 'Consider waiting for lower prices'
          : 'Current pricing is optimal',
        marketPosition.analysis.competitiveness > 10
          ? 'Strong competitive position'
          : 'Monitor competitor pricing'
      ]
    }
  } catch (error) {
    console.error('Error generating pricing report:', error)
    throw error
  }
}
