import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToProducts, createProduct, updateProduct, deleteProduct, calculateBulkPrice } from '../firebase/products'
import { useAuth } from '../context/AuthContext'

export default function ProductsPage() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
      } else {
        await createProduct(formData)
      }
      setShowModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId)
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-slate-400">{products.length} products available</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingProduct(null); setShowModal(true) }}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-card border border-surface-border rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card border border-surface-border rounded-xl overflow-hidden card-hover"
            >
              {/* Product Image */}
              <div className="aspect-square bg-surface-dark relative">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {product.bulkPricing?.length > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-accent-gold/90 text-black text-xs font-semibold rounded">
                    Bulk Pricing
                  </div>
                )}
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/90 text-white text-xs font-semibold rounded">
                    Low Stock
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="text-xs text-primary-400 mb-1">{product.category}</div>
                <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{product.description}</p>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">${product.basePrice?.toFixed(2)}</div>
                    {product.bulkPricing?.length > 0 && (
                      <div className="text-xs text-accent-emerald">
                        From ${calculateBulkPrice(product, product.bulkPricing[product.bulkPricing.length - 1]?.minQuantity || 100, 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">{product.stock} in stock</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingProduct(product); setShowModal(true) }}
                      className="p-2 bg-surface-dark hover:bg-surface-border rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-card border border-surface-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-primary-400 mb-1">{selectedProduct.category}</div>
                    <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-surface-dark rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-slate-400 mb-6">{selectedProduct.description}</p>

                {/* Bulk Pricing Table */}
                {selectedProduct.bulkPricing?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Bulk Pricing Tiers</h3>
                    <div className="bg-surface-dark rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="px-4 py-3 text-left text-sm text-slate-400">Min Quantity</th>
                            <th className="px-4 py-3 text-left text-sm text-slate-400">Discount</th>
                            <th className="px-4 py-3 text-left text-sm text-slate-400">Price/Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-surface-border">
                            <td className="px-4 py-3">1+</td>
                            <td className="px-4 py-3">-</td>
                            <td className="px-4 py-3 font-semibold">${selectedProduct.basePrice?.toFixed(2)}</td>
                          </tr>
                          {selectedProduct.bulkPricing.map((tier, i) => (
                            <tr key={i} className="border-b border-surface-border last:border-0">
                              <td className="px-4 py-3">{tier.minQuantity}+</td>
                              <td className="px-4 py-3 text-accent-emerald">
                                {tier.discountType === 'percentage' ? `${tier.discount}%` : `$${tier.discount}`}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                ${calculateBulkPrice(selectedProduct, tier.minQuantity, 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-surface-dark rounded-lg">
                    <div className="text-sm text-slate-400">Base Price</div>
                    <div className="text-2xl font-bold">${selectedProduct.basePrice?.toFixed(2)}</div>
                  </div>
                  <div className="flex-1 p-4 bg-surface-dark rounded-lg">
                    <div className="text-sm text-slate-400">Stock</div>
                    <div className="text-2xl font-bold">{selectedProduct.stock}</div>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-semibold transition-colors">
                  Add to Group Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductFormModal
            product={editingProduct}
            onSave={handleSaveProduct}
            onClose={() => { setShowModal(false); setEditingProduct(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductFormModal({ product, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    basePrice: product?.basePrice || '',
    stock: product?.stock || 0,
    bulkPricing: product?.bulkPricing || []
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...formData,
      basePrice: parseFloat(formData.basePrice),
      stock: parseInt(formData.stock)
    })
    setLoading(false)
  }

  const addBulkTier = () => {
    setFormData({
      ...formData,
      bulkPricing: [...formData.bulkPricing, { minQuantity: 10, discount: 5, discountType: 'percentage' }]
    })
  }

  const updateBulkTier = (index, field, value) => {
    const updated = [...formData.bulkPricing]
    updated[index] = { ...updated[index], [field]: field === 'discountType' ? value : parseFloat(value) }
    setFormData({ ...formData, bulkPricing: updated })
  }

  const removeBulkTier = (index) => {
    setFormData({
      ...formData,
      bulkPricing: formData.bulkPricing.filter((_, i) => i !== index)
    })
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
        className="bg-surface-card border border-surface-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{product ? 'Edit Product' : 'Add Product'}</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                min="0"
                className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Base Price ($)</label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          {/* Bulk Pricing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Bulk Pricing Tiers</label>
              <button
                type="button"
                onClick={addBulkTier}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                + Add Tier
              </button>
            </div>
            {formData.bulkPricing.map((tier, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={tier.minQuantity}
                  onChange={(e) => updateBulkTier(i, 'minQuantity', e.target.value)}
                  placeholder="Min qty"
                  className="w-24 px-3 py-2 bg-surface-dark border border-surface-border rounded-lg text-sm"
                />
                <input
                  type="number"
                  value={tier.discount}
                  onChange={(e) => updateBulkTier(i, 'discount', e.target.value)}
                  placeholder="Discount"
                  className="w-20 px-3 py-2 bg-surface-dark border border-surface-border rounded-lg text-sm"
                />
                <select
                  value={tier.discountType}
                  onChange={(e) => updateBulkTier(i, 'discountType', e.target.value)}
                  className="px-3 py-2 bg-surface-dark border border-surface-border rounded-lg text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">$</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeBulkTier(i)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface-dark hover:bg-surface-border rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
