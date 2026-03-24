import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  subscribeToShipments,
  createShipment,
  updateTracking,
  addTrackingEvent,
  updateShipmentStatus,
  getTrackingUrl,
  CARRIERS
} from '../firebase/shipping'
import { useAuth } from '../context/AuthContext'

export default function ShippingPage() {
  const { isAdmin } = useAuth()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [showTrackingModal, setShowTrackingModal] = useState(null)

  useEffect(() => {
    const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
    const unsubscribe = subscribeToShipments((data) => {
      setShipments(data)
      setLoading(false)
    }, filters)
    return () => unsubscribe()
  }, [statusFilter])

  const statusCounts = {
    all: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400',
      processing: 'bg-blue-500/20 text-blue-400',
      in_transit: 'bg-cyan-500/20 text-cyan-400',
      out_for_delivery: 'bg-purple-500/20 text-purple-400',
      delivered: 'bg-accent-emerald/20 text-accent-emerald',
      cancelled: 'bg-red-500/20 text-red-400'
    }
    return colors[status] || 'bg-slate-500/20 text-slate-400'
  }

  const getCarrierIcon = (carrier) => {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shipping Management</h1>
          <p className="text-slate-400">Track and manage all shipments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: statusCounts.all, color: 'primary' },
          { label: 'Pending', value: statusCounts.pending, color: 'amber' },
          { label: 'In Transit', value: statusCounts.in_transit, color: 'cyan' },
          { label: 'Delivered', value: statusCounts.delivered, color: 'emerald' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-xl bg-surface-card border border-surface-border"
          >
            <div className="text-sm text-slate-400">{stat.label}</div>
            <div className={`text-3xl font-bold mt-1 text-${stat.color}-400`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-surface-card rounded-lg w-fit">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'in_transit', label: 'In Transit' },
          { id: 'delivered', label: 'Delivered' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
              statusFilter === filter.id
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {filter.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              statusFilter === filter.id ? 'bg-white/20' : 'bg-surface-border'
            }`}>
              {statusCounts[filter.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Shipments List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-xl mb-2">No Shipments</p>
          <p className="text-sm">Shipments will appear here when orders are processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map(shipment => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onSelect={() => setSelectedShipment(shipment)}
              onAddTracking={() => setShowTrackingModal(shipment)}
              getStatusColor={getStatusColor}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Shipment Detail Modal */}
      <AnimatePresence>
        {selectedShipment && (
          <ShipmentDetailModal
            shipment={selectedShipment}
            onClose={() => setSelectedShipment(null)}
            onUpdateStatus={async (status) => {
              await updateShipmentStatus(selectedShipment.id, status)
              setSelectedShipment(null)
            }}
            getStatusColor={getStatusColor}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Add Tracking Modal */}
      <AnimatePresence>
        {showTrackingModal && (
          <AddTrackingModal
            shipment={showTrackingModal}
            onClose={() => setShowTrackingModal(null)}
            onSave={async (carrier, trackingNumber) => {
              await updateTracking(showTrackingModal.id, carrier, trackingNumber)
              setShowTrackingModal(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ShipmentCard({ shipment, onSelect, onAddTracking, getStatusColor, isAdmin }) {
  const trackingUrl = shipment.trackingNumber
    ? getTrackingUrl(shipment.carrier, shipment.trackingNumber)
    : null

  return (
    <div className="p-6 bg-surface-card border border-surface-border rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(shipment.status)}`}>
              {shipment.status?.replace('_', ' ')}
            </span>
            {shipment.type === 'aggregated' && (
              <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold rounded-full text-xs font-medium">
                Aggregated
              </span>
            )}
          </div>
          <div className="font-mono text-sm text-slate-400 mb-1">
            ID: {shipment.id.slice(0, 12)}...
          </div>
          {shipment.trackingNumber ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{CARRIERS[shipment.carrier]?.name || shipment.carrier}:</span>
              {trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 font-mono text-sm"
                >
                  {shipment.trackingNumber}
                </a>
              ) : (
                <span className="font-mono text-sm">{shipment.trackingNumber}</span>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No tracking number yet</div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm text-slate-400 mb-1">Destination</div>
          <div className="text-sm">
            {shipment.destination?.city}, {shipment.destination?.country || 'N/A'}
          </div>
          {shipment.orderIds?.length > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              {shipment.orderIds.length} orders combined
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-sm text-slate-400 mb-1">Last Update</div>
          <div className="text-sm">
            {shipment.trackingHistory?.length > 0
              ? format(new Date(shipment.trackingHistory[shipment.trackingHistory.length - 1].timestamp), 'MMM d, HH:mm')
              : shipment.createdAt?.toDate
                ? format(shipment.createdAt.toDate(), 'MMM d, HH:mm')
                : 'N/A'}
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && !shipment.trackingNumber && (
            <button
              onClick={onAddTracking}
              className="px-4 py-2 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors text-sm"
            >
              Add Tracking
            </button>
          )}
          <button
            onClick={onSelect}
            className="px-4 py-2 bg-surface-dark hover:bg-surface-border rounded-lg transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}

function ShipmentDetailModal({ shipment, onClose, onUpdateStatus, getStatusColor, isAdmin }) {
  const trackingUrl = shipment.trackingNumber
    ? getTrackingUrl(shipment.carrier, shipment.trackingNumber)
    : null

  const statuses = ['pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered']

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
        className="bg-surface-card border border-surface-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(shipment.status)}`}>
                  {shipment.status?.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold">Shipment Details</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-dark rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tracking Info */}
          {shipment.trackingNumber && (
            <div className="p-4 bg-surface-dark rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Tracking Number</div>
                  <div className="font-mono text-lg">{shipment.trackingNumber}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Carrier: {CARRIERS[shipment.carrier]?.name || shipment.carrier}
                  </div>
                </div>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Track Package
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Destination */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Destination</h3>
            <div className="p-4 bg-surface-dark rounded-lg">
              <div className="text-sm">
                {shipment.destination?.address || 'Address not specified'}<br />
                {shipment.destination?.city}, {shipment.destination?.postalCode}<br />
                {shipment.destination?.country}
              </div>
            </div>
          </div>

          {/* Tracking History */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Tracking History</h3>
            {shipment.trackingHistory?.length > 0 ? (
              <div className="space-y-3">
                {[...shipment.trackingHistory].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-accent-emerald' : 'bg-surface-border'}`} />
                      {i < shipment.trackingHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-surface-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium capitalize">{event.status?.replace('_', ' ')}</div>
                      <div className="text-sm text-slate-400">{event.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {event.timestamp ? format(new Date(event.timestamp), 'MMM d, yyyy HH:mm') : 'N/A'}
                        {event.location && ` - ${event.location}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                No tracking events yet
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && shipment.status !== 'delivered' && (
            <div>
              <h3 className="font-semibold mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => onUpdateStatus(status)}
                    disabled={status === shipment.status}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                      status === shipment.status
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-dark hover:bg-surface-border'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function AddTrackingModal({ shipment, onClose, onSave }) {
  const [carrier, setCarrier] = useState('ups')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(carrier, trackingNumber)
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
          <h2 className="text-xl font-bold">Add Tracking Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Carrier</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg"
            >
              {Object.entries(CARRIERS).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
              placeholder="Enter tracking number"
              className="w-full px-4 py-2.5 bg-surface-dark border border-surface-border rounded-lg font-mono"
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
              disabled={loading || !trackingNumber}
              className="flex-1 py-2.5 bg-accent-gold hover:bg-amber-500 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
