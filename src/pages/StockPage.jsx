import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToProducts, updateProduct } from '../firebase/products'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useStakeholder } from '../context/StakeholderContext'
import { useChat } from '../context/ChatContext'
import { DataLoading } from '../components/LoadingSpinner'
import ProductInvestmentTracker from '../components/ProductInvestmentTracker'
import ProductAllocationSlider from '../components/ProductAllocationSlider'
import ProductDiscussionPanel from '../components/ProductDiscussionPanel'

export default function StockPage() {
  const { t } = useLanguage()
  const { isAdmin, user } = useAuth()
  const { isDark } = useTheme()
  const { myAllocations, getMyAllocation } = useStakeholder()
  const { selectRoom } = useChat()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [discussionProduct, setDiscussionProduct] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const getStockStatus = (stock, reserved = 0) => {
    const available = stock - reserved
    if (available <= 0) return { status: 'out', labelKey: 'outOfStock', color: 'stock-out' }
    if (available <= 10) return { status: 'critical', labelKey: 'critical', color: 'text-red-500' }
    if (available <= 50) return { status: 'low', labelKey: 'lowStock', color: 'stock-low' }
    if (available <= 100) return { status: 'medium', labelKey: 'medium', color: 'stock-medium' }
    return { status: 'high', labelKey: 'inStock', color: 'stock-high' }
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const stockStatus = getStockStatus(p.stock, p.reservedStock)
      const matchesStock = stockFilter === 'all' || stockStatus.status === stockFilter
      return matchesSearch && matchesCategory && matchesStock
    })
    .sort((a, b) => {
      let compare = 0
      switch (sortBy) {
        case 'name':
          compare = (a.name || '').localeCompare(b.name || '')
          break
        case 'stock':
          compare = (a.stock || 0) - (b.stock || 0)
          break
        case 'price':
          compare = (a.basePrice || 0) - (b.basePrice || 0)
          break
        case 'category':
          compare = (a.category || '').localeCompare(b.category || '')
          break
        default:
          compare = 0
      }
      return sortOrder === 'asc' ? compare : -compare
    })

  const stockSummary = {
    total: products.length,
    inStock: products.filter(p => getStockStatus(p.stock, p.reservedStock).status === 'high').length,
    lowStock: products.filter(p => ['low', 'medium'].includes(getStockStatus(p.stock, p.reservedStock).status)).length,
    critical: products.filter(p => getStockStatus(p.stock, p.reservedStock).status === 'critical').length,
    outOfStock: products.filter(p => getStockStatus(p.stock, p.reservedStock).status === 'out').length,
    totalValue: products.reduce((sum, p) => sum + (p.stock || 0) * (p.basePrice || 0), 0),
    reservedValue: products.reduce((sum, p) => sum + (p.reservedStock || 0) * (p.basePrice || 0), 0)
  }

  return (
    <div className="wireframe-container space-y-6">
      {/* Header */}
      <div className="wireframe-section-header">
        <div>
          <h1 className="text-2xl font-bold">{t('stockManagement')}</h1>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
            {t('manageInventory')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('products')}</div>
          <div className="text-2xl font-bold mt-1">{stockSummary.total}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('inStock')}</div>
          <div className="text-2xl font-bold mt-1 text-emerald-500">{stockSummary.inStock}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('lowStock')}</div>
          <div className="text-2xl font-bold mt-1 text-amber-500">{stockSummary.lowStock}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('critical')}</div>
          <div className="text-2xl font-bold mt-1 text-red-500">{stockSummary.critical}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('outOfStock')}</div>
          <div className="text-2xl font-bold mt-1 text-slate-500">{stockSummary.outOfStock}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="wireframe-card text-center"
        >
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('total')} {t('price')}</div>
          <div className="text-2xl font-bold mt-1 text-primary-500">${stockSummary.totalValue.toLocaleString()}</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="wireframe-card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                isDark
                  ? 'bg-surface-dark border-surface-border text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              } focus:ring-2 focus:ring-primary-500`}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDark
                ? 'bg-surface-dark border-surface-border text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">{t('all')} {t('categories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border ${
              isDark
                ? 'bg-surface-dark border-surface-border text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">{t('stockStatus')}</option>
            <option value="high">{t('inStock')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="low">{t('lowStock')}</option>
            <option value="critical">{t('critical')}</option>
            <option value="out">{t('outOfStock')}</option>
          </select>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2.5 rounded-lg border ${
                isDark
                  ? 'bg-surface-dark border-surface-border text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="name">{t('name')}</option>
              <option value="stock">{t('stock')}</option>
              <option value="price">{t('price')}</option>
              <option value="category">{t('category')}</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-2.5 rounded-lg border ${
                isDark
                  ? 'bg-surface-dark border-surface-border hover:bg-surface-border'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      {loading ? (
        <div className="wireframe-card flex justify-center py-12">
          <DataLoading text={t('loading')} />
        </div>
      ) : (
        <div className="wireframe-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-surface-border bg-surface-dark' : 'border-gray-200 bg-gray-50'}`}>
                  <th className="px-6 py-4 text-left text-sm font-medium">{t('products')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">{t('category')}</th>
                  <th className="px-6 py-4 text-center text-sm font-medium">{t('currentStock')}</th>
                  <th className="px-6 py-4 text-center text-sm font-medium">{t('available')}</th>
                  <th className="px-6 py-4 text-center text-sm font-medium">{t('status')}</th>
                  <th className="px-6 py-4 text-center text-sm font-medium">{t('investmentAllocation')}</th>
                  {user && <th className="px-6 py-4 text-center text-sm font-medium">{t('myAllocation')}</th>}
                  <th className="px-6 py-4 text-center text-sm font-medium">{t('discuss')}</th>
                  <th className="px-6 py-4 text-right text-sm font-medium">{t('price')}</th>
                  {isAdmin && <th className="px-6 py-4 text-center text-sm font-medium">{t('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 11 : (user ? 10 : 9)} className="px-6 py-12 text-center">
                      <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>{t('noResults')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, i) => {
                    const available = (product.stock || 0) - (product.reservedStock || 0)
                    const stockStatus = getStockStatus(product.stock, product.reservedStock)
                    const value = (product.stock || 0) * (product.basePrice || 0)
                    const myAllocation = getMyAllocation(product.id)

                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b table-row-hover ${isDark ? 'border-surface-border' : 'border-gray-100'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDark ? 'bg-surface-dark' : 'bg-gray-100'
                            }`}>
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {product.sku || `SKU-${product.id?.slice(0, 6).toUpperCase()}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isDark ? 'bg-primary-500/20 text-primary-400' : 'bg-primary-100 text-primary-600'
                          }`}>
                            {product.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">
                          {product.stock?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">
                          {available.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stockStatus.status === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                            stockStatus.status === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            stockStatus.status === 'low' ? 'bg-orange-500/20 text-orange-400' :
                            stockStatus.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {t(stockStatus.labelKey)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <ProductInvestmentTracker productId={product.id} compact />
                        </td>
                        {user && (
                          <td className="px-6 py-4">
                            <ProductAllocationSlider productId={product.id} compact />
                          </td>
                        )}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setDiscussionProduct(
                              discussionProduct?.id === product.id ? null : product
                            )}
                            className={`p-2 rounded-lg transition-colors ${
                              discussionProduct?.id === product.id
                                ? 'bg-primary-600 text-white'
                                : isDark
                                  ? 'hover:bg-surface-dark text-slate-400 hover:text-white'
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          ${value.toLocaleString()}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowConfigModal(true)
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-surface-dark' : 'hover:bg-gray-100'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Discussion Panel */}
      <AnimatePresence>
        {discussionProduct && (
          <ProductDiscussionPanel
            productId={discussionProduct.id}
            productName={discussionProduct.name}
            isOpen={!!discussionProduct}
            onClose={() => setDiscussionProduct(null)}
            onOpenFullChat={(room) => {
              selectRoom(room)
              setDiscussionProduct(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Stock Configuration Modal */}
      <AnimatePresence>
        {showConfigModal && selectedProduct && (
          <StockConfigModal
            product={selectedProduct}
            onClose={() => {
              setShowConfigModal(false)
              setSelectedProduct(null)
            }}
            onSave={async (updates) => {
              await updateProduct(selectedProduct.id, updates)
              setShowConfigModal(false)
              setSelectedProduct(null)
            }}
            isDark={isDark}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StockConfigModal({ product, onClose, onSave, isDark, t }) {
  const [formData, setFormData] = useState({
    stock: product.stock || 0,
    reservedStock: product.reservedStock || 0,
    minStock: product.minStock || 10,
    maxStock: product.maxStock || 1000,
    reorderPoint: product.reorderPoint || 50,
    reorderQuantity: product.reorderQuantity || 100,
    sku: product.sku || '',
    location: product.location || '',
    supplier: product.supplier || '',
    leadTimeDays: product.leadTimeDays || 7
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(formData)
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-surface-card border border-surface-border' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t('stockConfiguration')}</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{product.name}</p>
            </div>
            <button type="button" onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-surface-dark' : 'hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stock Levels */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-4">{t('stockLevel')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('currentStock')}</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('reserved')}</label>
                <input
                  type="number"
                  value={formData.reservedStock}
                  onChange={(e) => setFormData({ ...formData, reservedStock: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('minQuantity')}</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('high')}</label>
                <input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Reorder Settings */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-4">{t('reorderPoint')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('reorderPoint')}</label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('lowStockAlert')}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('quantity')}</label>
                <input
                  type="number"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t('reorderRequired')}</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-surface-dark' : 'bg-gray-50'}`}>
            <h3 className="font-semibold mb-4">{t('productDetails')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('sku')}</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., PROD-001"
                  className={`w-full px-4 py-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('location')}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t('warehouse')}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('supplier')}</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder={t('supplier')}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t('leadTime')} ({t('days')})</label>
                <input
                  type="number"
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark ? 'bg-surface-card border-surface-border' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-surface-dark hover:bg-surface-border' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
