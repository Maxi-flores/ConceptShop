import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  subscribeToUserOrders,
  subscribeToGroupOrders,
  createGroupOrder,
  joinGroupOrder,
  finalizeGroupOrder
} from '../firebase/orders'
import { subscribeToProducts } from '../firebase/products'
import { useAuth } from '../context/AuthContext'
import { useStakeholder } from '../context/StakeholderContext'

export default function OrdersPage() {
  const { user, isAdmin } = useAuth()
  const { recordOrderContribution } = useStakeholder()
  const [activeTab, setActiveTab] = useState('group')
  const [myOrders, setMyOrders] = useState([])
  const [groupOrders, setGroupOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(null)

  useEffect(() => {
    if (!user) return

    const unsubMyOrders = subscribeToUserOrders(user.uid, setMyOrders)
    const unsubGroupOrders = subscribeToGroupOrders(setGroupOrders)
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data)
      setLoading(false)
    })

    return () => {
      unsubMyOrders()
      unsubGroupOrders()
      unsubProducts()
    }
  }, [user])

  const openGroupOrders = groupOrders.filter(o => o.status === 'open')
  const myGroupOrders = groupOrders.filter(o =>
    o.participants?.some(p => p.userId === user?.uid) || o.creatorId === user?.uid
  )

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      processing: 'bg-purple-500/20 text-purple-400',
      shipped: 'bg-cyan-500/20 text-cyan-400',
      delivered: 'bg-emerald-500/20 text-emerald-400',
      cancelled: 'bg-red-500/20 text-red-400',
      open: 'bg-accent-gold/20 text-accent-gold',
      finalized: 'bg-emerald-500/20 text-emerald-400'
    }
    return colors[status] || 'bg-slate-500/20 text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-slate-400">Manage group orders and your personal orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Group Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-lg w-fit">
        {[
          { id: 'group', label: 'Group Orders', count: openGroupOrders.length },
          { id: 'my-group', label: 'My Group Orders', count: myGroupOrders.length },
          { id: 'personal', label: 'My Orders', count: myOrders.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-surface-border'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Group Orders */}
          {activeTab === 'group' && (
            <div className="grid gap-4">
              {openGroupOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg">No open group orders</p>
                  <p className="text-sm mt-1">Create one to start pooling orders!</p>
                </div>
              ) : (
                openGroupOrders.map(order => (
                  <GroupOrderCard
                    key={order.id}
                    order={order}
                    onJoin={() => setShowJoinModal(order)}
                    getStatusColor={getStatusColor}
                    isParticipant={order.participants?.some(p => p.userId === user?.uid)}
                    isCreator={order.creatorId === user?.uid}
                  />
                ))
              )}
            </div>
          )}

          {/* My Group Orders */}
          {activeTab === 'my-group' && (
            <div className="grid gap-4">
              {myGroupOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg">You haven't joined any group orders yet</p>
                </div>
              ) : (
                myGroupOrders.map(order => (
                  <GroupOrderCard
                    key={order.id}
                    order={order}
                    onJoin={() => setShowJoinModal(order)}
                    getStatusColor={getStatusColor}
                    isParticipant={order.participants?.some(p => p.userId === user?.uid)}
                    isCreator={order.creatorId === user?.uid}
                    onFinalize={isAdmin || order.creatorId === user?.uid ? () => finalizeGroupOrder(order.id) : null}
                  />
                ))
              )}
            </div>
          )}

          {/* Personal Orders */}
          {activeTab === 'personal' && (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    myOrders.map(order => (
                      <tr key={order.id} className="border-b border-surface-border last:border-0 table-row-hover">
                        <td className="px-6 py-4 font-mono text-sm">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          {order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Group Order Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupOrderModal
            products={products}
            onClose={() => setShowCreateModal(false)}
            onCreate={async (data) => {
              await createGroupOrder(user.uid, data.productId, data.targetQuantity, data.deadline)
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Join Group Order Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinGroupOrderModal
            order={showJoinModal}
            onClose={() => setShowJoinModal(null)}
            onJoin={async (quantity) => {
              const productId = showJoinModal.products[0].productId
              await joinGroupOrder(showJoinModal.id, user.uid, productId, quantity)
              setShowJoinModal(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupOrderCard({ order, onJoin, getStatusColor, isParticipant, isCreator, onFinalize }) {
  const product = order.products?.[0]
  const progress = product ? (product.currentQuantity / product.targetQuantity) * 100 : 0
  const savings = product ? ((product.basePrice - product.currentPrice) / product.basePrice * 100) : 0

  return (
    <div className="p-6 bg-surface-card border border-surface-border rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            {isCreator && (
              <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
                Creator
              </span>
            )}
            {isParticipant && !isCreator && (
              <span className="px-2 py-1 bg-accent-emerald/20 text-accent-emerald rounded-full text-xs font-medium">
                Joined
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold">{product?.productName || 'Group Order'}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {order.participants?.length || 0} participants
          </p>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Progress</span>
            <span className="font-medium">
              {product?.currentQuantity || 0} / {product?.targetQuantity || 0} units
            </span>
          </div>
          <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-emerald rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">${product?.currentPrice?.toFixed(2)}</div>
            {savings > 0 && (
              <div className="text-sm text-accent-emerald">-{savings.toFixed(1)}% savings</div>
            )}
          </div>

          <div className="flex gap-2">
            {order.status === 'open' && !isParticipant && (
              <button
                onClick={onJoin}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Join Order
              </button>
            )}
            {onFinalize && order.status === 'open' && progress >= 100 && (
              <button
                onClick={onFinalize}
                className="px-4 py-2 bg-accent-emerald hover:bg-emerald-600 rounded-lg font-medium transition-colors"
              >
                Finalize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateGroupOrderModal({ products, onClose, onCreate }) {
  const [productId, setProductId] = useState('')
  const [targetQuantity, setTargetQuantity] = useState(100)
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onCreate({ productId, targetQuantity, deadline: new Date(deadline) })
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
        className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Create Group Order</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            >
              <option value="">Select a product...</option>
              {products.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ${p.basePrice?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Target Quantity</label>
            <input
              type="number"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(parseInt(e.target.value))}
              min="10"
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
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
              className="flex-1 py-2.5 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function JoinGroupOrderModal({ order, onClose, onJoin }) {
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const product = order.products?.[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onJoin(quantity)
    setLoading(false)
  }

  const estimatedPrice = product?.currentPrice || product?.basePrice || 0
  const total = estimatedPrice * quantity

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
        className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Join Group Order</h2>

          <div className="p-4 bg-surface-dark rounded-lg">
            <div className="font-medium">{product?.productName}</div>
            <div className="text-sm text-slate-400 mt-1">
              Current price: ${estimatedPrice.toFixed(2)} per unit
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min="1"
              required
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            />
          </div>

          <div className="p-4 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Estimated Total</span>
              <span className="font-bold text-accent-gold">${total.toFixed(2)}</span>
            </div>
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
              {loading ? 'Joining...' : 'Join Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
