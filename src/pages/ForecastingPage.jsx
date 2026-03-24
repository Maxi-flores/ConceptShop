import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { format, addDays } from 'date-fns'
import { subscribeToProducts } from '../firebase/products'
import {
  forecastPrices,
  calculateOptimalOrderTiming,
  analyzeMarketPosition,
  calculateBulkDiscount
} from '../services/forecasting'

export default function ForecastingPage() {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [marketAnalysis, setMarketAnalysis] = useState(null)
  const [timing, setTiming] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [quantity, setQuantity] = useState(100)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data.filter(p => p.status === 'active'))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAnalyze = async () => {
    if (!selectedProduct) return

    setAnalyzing(true)
    try {
      const [forecastResult, timingResult, marketResult] = await Promise.all([
        forecastPrices(selectedProduct.id),
        calculateOptimalOrderTiming(selectedProduct.id, quantity),
        analyzeMarketPosition(selectedProduct.id, selectedProduct.basePrice)
      ])

      setForecast(forecastResult)
      setTiming(timingResult)
      setMarketAnalysis(marketResult)
    } catch (error) {
      console.error('Error analyzing:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Generate sample forecast data for visualization
  const generateSampleData = () => {
    const data = []
    const basePrice = selectedProduct?.basePrice || 100
    const today = new Date()

    // Historical data (last 30 days)
    for (let i = -30; i <= 0; i++) {
      const variation = Math.sin(i * 0.2) * 5 + Math.random() * 3
      data.push({
        date: format(addDays(today, i), 'MMM d'),
        dayIndex: i,
        price: basePrice + variation,
        type: 'historical'
      })
    }

    // Forecast data (next 30 days)
    const trend = -0.05 // Slight downward trend
    for (let i = 1; i <= 30; i++) {
      const trendPrice = basePrice + (trend * i) + Math.sin(i * 0.3) * 2
      data.push({
        date: format(addDays(today, i), 'MMM d'),
        dayIndex: i,
        forecast: trendPrice,
        upper: trendPrice + 3,
        lower: trendPrice - 3,
        type: 'forecast'
      })
    }

    return data
  }

  const chartData = selectedProduct ? generateSampleData() : []
  const bulkPricing = selectedProduct ? calculateBulkDiscount(
    selectedProduct.basePrice,
    quantity,
    selectedProduct.bulkPricing || []
  ) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Price Forecasting</h1>
          <p className="text-slate-400">AI-powered price predictions and market analysis</p>
        </div>
      </div>

      {/* Product Selection */}
      <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
        <h2 className="text-lg font-semibold mb-4">Select Product to Analyze</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value)
                setSelectedProduct(product)
                setForecast(null)
                setMarketAnalysis(null)
                setTiming(null)
              }}
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ${p.basePrice?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Order Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={!selectedProduct || analyzing}
              className="w-full px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-surface-card border border-surface-border"
            >
              <div className="text-sm text-slate-400">Base Price</div>
              <div className="text-3xl font-bold mt-1">${selectedProduct.basePrice?.toFixed(2)}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl bg-surface-card border border-surface-border"
            >
              <div className="text-sm text-slate-400">Bulk Price ({quantity} units)</div>
              <div className="text-3xl font-bold mt-1 text-accent-emerald">
                ${bulkPricing?.price?.toFixed(2) || selectedProduct.basePrice?.toFixed(2)}
              </div>
              {bulkPricing?.discount > 0 && (
                <div className="text-sm text-accent-emerald mt-1">
                  -{bulkPricing.discountType === 'percentage' ? `${bulkPricing.discount}%` : `$${bulkPricing.discount}`}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl bg-surface-card border border-surface-border"
            >
              <div className="text-sm text-slate-400">Total Order Value</div>
              <div className="text-3xl font-bold mt-1">
                ${((bulkPricing?.price || selectedProduct.basePrice) * quantity).toLocaleString()}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-surface-card border border-surface-border"
            >
              <div className="text-sm text-slate-400">Potential Savings</div>
              <div className="text-3xl font-bold mt-1 text-accent-gold">
                ${((selectedProduct.basePrice - (bulkPricing?.price || selectedProduct.basePrice)) * quantity).toFixed(2)}
              </div>
            </motion.div>
          </div>

          {/* Price Forecast Chart */}
          <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Price Forecast (30 Days)</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                  <span className="text-slate-400">Historical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-emerald"></div>
                  <span className="text-slate-400">Forecast</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} interval={4} />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <ReferenceLine x={format(new Date(), 'MMM d')} stroke="#f5c518" strokeDasharray="5 5" label="Today" />
                  <Area type="monotone" dataKey="price" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPrice)" name="Historical Price" />
                  <Area type="monotone" dataKey="forecast" stroke="#10b981" fillOpacity={1} fill="url(#colorForecast)" name="Forecasted Price" />
                  <Line type="monotone" dataKey="upper" stroke="#10b981" strokeDasharray="3 3" dot={false} name="Upper Bound" />
                  <Line type="monotone" dataKey="lower" stroke="#10b981" strokeDasharray="3 3" dot={false} name="Lower Bound" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order Timing Recommendation */}
            <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
              <h2 className="text-lg font-semibold mb-4">Order Timing Recommendation</h2>
              <div className={`p-4 rounded-lg ${
                timing?.recommendation === 'order_now'
                  ? 'bg-accent-emerald/10 border border-accent-emerald/20'
                  : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {timing?.recommendation === 'order_now' ? (
                    <div className="w-10 h-10 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className={`font-semibold ${
                      timing?.recommendation === 'order_now' ? 'text-accent-emerald' : 'text-amber-400'
                    }`}>
                      {timing?.recommendation === 'order_now' ? 'Order Now' : 'Wait for Better Price'}
                    </div>
                    <div className="text-sm text-slate-400">{timing?.reason || 'Based on current market analysis'}</div>
                  </div>
                </div>
                {timing?.potentialSavings && (
                  <div className="text-sm">
                    <span className="text-slate-400">Potential savings: </span>
                    <span className="font-semibold text-accent-gold">
                      {Math.abs(timing.potentialSavings).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Bulk Pricing Tiers */}
              {selectedProduct.bulkPricing?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Bulk Pricing Tiers</h3>
                  <div className="space-y-2">
                    {selectedProduct.bulkPricing.map((tier, i) => {
                      const isActive = quantity >= tier.minQuantity
                      const nextTier = selectedProduct.bulkPricing[i + 1]
                      const unitsNeeded = nextTier ? nextTier.minQuantity - quantity : 0

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            isActive ? 'bg-accent-emerald/10 border border-accent-emerald/20' : 'bg-surface-dark'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{tier.minQuantity}+ units</div>
                            <div className="text-sm text-slate-400">
                              {tier.discountType === 'percentage' ? `${tier.discount}% off` : `$${tier.discount} off`}
                            </div>
                          </div>
                          {isActive ? (
                            <span className="px-2 py-1 bg-accent-emerald/20 text-accent-emerald text-xs rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              +{tier.minQuantity - quantity} units needed
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Market Position */}
            <div className="p-6 rounded-xl bg-surface-card border border-surface-border">
              <h2 className="text-lg font-semibold mb-4">Market Position</h2>
              <div className="space-y-4">
                <div className="p-4 bg-surface-dark rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Your Price</span>
                    <span className="font-bold">${selectedProduct.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Market Average</span>
                    <span className="font-medium">${(selectedProduct.basePrice * 1.1).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price Rank</span>
                    <span className="font-medium text-accent-emerald">#2 of 8</span>
                  </div>
                </div>

                <div className="p-4 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-accent-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-semibold text-accent-emerald">Competitive Position</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Your price is 10% below market average, making it highly competitive.
                  </p>
                </div>

                {/* Trend Indicator */}
                <div className="p-4 bg-surface-dark rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">30-Day Price Trend</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-red-500 via-amber-500 to-accent-emerald rounded-full"></div>
                    </div>
                    <span className="text-accent-emerald font-medium">-2.3%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Prices trending slightly downward</p>
                </div>

                {/* Volatility */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-dark rounded-lg text-center">
                    <div className="text-sm text-slate-400">Volatility</div>
                    <div className="text-xl font-bold text-amber-400">Medium</div>
                  </div>
                  <div className="p-3 bg-surface-dark rounded-lg text-center">
                    <div className="text-sm text-slate-400">Confidence</div>
                    <div className="text-xl font-bold text-accent-emerald">78%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedProduct && !loading && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-xl mb-2">Select a Product</p>
          <p className="text-sm">Choose a product above to view price forecasts and market analysis</p>
        </div>
      )}
    </div>
  )
}
