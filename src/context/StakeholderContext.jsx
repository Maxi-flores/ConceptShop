import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import {
  subscribeToAllProductStats,
  subscribeToUserAllocations,
  updateProductAllocation,
  getProductInvestmentStats
} from '../firebase/products'

const StakeholderContext = createContext(null)

export function StakeholderProvider({ children }) {
  const { user, profile } = useAuth()
  const [stakeholders, setStakeholders] = useState([])
  const [myStake, setMyStake] = useState(null)
  const [totalPool, setTotalPool] = useState({
    totalInvestment: 0,
    totalShares: 0,
    activeStakeholders: 0
  })
  const [loading, setLoading] = useState(true)

  // Product allocation state
  const [productAllocations, setProductAllocations] = useState({})
  const [myAllocations, setMyAllocations] = useState({})

  // Subscribe to all stakeholders
  useEffect(() => {
    if (!user) {
      setStakeholders([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'stakeholders'),
      orderBy('totalShares', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stakeholderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setStakeholders(stakeholderData)

      // Calculate pool totals
      const totals = stakeholderData.reduce((acc, s) => ({
        totalInvestment: acc.totalInvestment + (s.investmentAmount || 0),
        totalShares: acc.totalShares + (s.totalShares || 0),
        activeStakeholders: acc.activeStakeholders + (s.status === 'active' ? 1 : 0)
      }), { totalInvestment: 0, totalShares: 0, activeStakeholders: 0 })

      setTotalPool(totals)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Subscribe to current user's stake
  useEffect(() => {
    if (!user) {
      setMyStake(null)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, 'stakeholders', user.uid),
      (doc) => {
        if (doc.exists()) {
          setMyStake({ id: doc.id, ...doc.data() })
        }
      }
    )

    return () => unsubscribe()
  }, [user])

  // Subscribe to all product allocation stats
  useEffect(() => {
    if (!stakeholders.length) {
      setProductAllocations({})
      return
    }

    const unsubscribe = subscribeToAllProductStats(stakeholders, (stats) => {
      setProductAllocations(stats)
    })

    return () => unsubscribe()
  }, [stakeholders])

  // Subscribe to current user's allocations
  useEffect(() => {
    if (!user) {
      setMyAllocations({})
      return
    }

    const unsubscribe = subscribeToUserAllocations(user.uid, (allocations) => {
      setMyAllocations(allocations)
    })

    return () => unsubscribe()
  }, [user])

  // Add investment
  const addInvestment = async (amount) => {
    if (!user) throw new Error('Must be logged in')

    const stakeholderRef = doc(db, 'stakeholders', user.uid)
    const userRef = doc(db, 'users', user.uid)

    // Calculate new shares (1 share per 100 currency units invested)
    const newShares = Math.floor(amount / 100)

    await updateDoc(stakeholderRef, {
      investmentAmount: increment(amount),
      totalShares: increment(newShares),
      lastActivityAt: serverTimestamp()
    })

    await updateDoc(userRef, {
      'shares.investment': increment(newShares),
      'shares.total': increment(newShares),
      updatedAt: serverTimestamp()
    })

    // Update tier based on total investment
    await updateStakeholderTier(user.uid)
  }

  // Record order contribution
  const recordOrderContribution = async (userId, orderValue) => {
    const stakeholderRef = doc(db, 'stakeholders', userId)
    const userRef = doc(db, 'users', userId)

    // Calculate participation shares (1 share per 500 in order value)
    const participationShares = Math.floor(orderValue / 500)

    await updateDoc(stakeholderRef, {
      orderContribution: increment(orderValue),
      totalShares: increment(participationShares),
      lastActivityAt: serverTimestamp()
    })

    await updateDoc(userRef, {
      'shares.participation': increment(participationShares),
      'shares.total': increment(participationShares),
      updatedAt: serverTimestamp()
    })

    await updateStakeholderTier(userId)
  }

  // Update stakeholder tier
  const updateStakeholderTier = async (userId) => {
    const stakeholderRef = doc(db, 'stakeholders', userId)
    const stakeholderDoc = await getDoc(stakeholderRef)

    if (!stakeholderDoc.exists()) return

    const data = stakeholderDoc.data()
    const totalValue = (data.investmentAmount || 0) + (data.orderContribution || 0)

    let tier = 'bronze'
    if (totalValue >= 50000) tier = 'platinum'
    else if (totalValue >= 20000) tier = 'gold'
    else if (totalValue >= 5000) tier = 'silver'

    await updateDoc(stakeholderRef, { tier })
  }

  // Calculate share percentage for a stakeholder
  const calculateSharePercentage = (stakeholderShares) => {
    if (totalPool.totalShares === 0) return 0
    return ((stakeholderShares / totalPool.totalShares) * 100).toFixed(2)
  }

  // Get top stakeholders
  const getTopStakeholders = (limit = 10) => {
    return stakeholders.slice(0, limit)
  }

  // Set product allocation for current user
  const setProductAllocation = async (productId, percentage) => {
    if (!user) throw new Error('Must be logged in')
    await updateProductAllocation(productId, user.uid, percentage)
  }

  // Get stats for a specific product
  const getProductStats = (productId) => {
    return productAllocations[productId] || {
      stakeholderCount: 0,
      totalStakeholders: stakeholders.length,
      participationRate: 0,
      totalAllocatedAmount: 0,
      totalPoolAmount: totalPool.totalInvestment,
      allocationRate: 0
    }
  }

  // Get my allocation for a specific product
  const getMyAllocation = (productId) => {
    return myAllocations[productId] || 0
  }

  const value = {
    stakeholders,
    myStake,
    totalPool,
    loading,
    addInvestment,
    recordOrderContribution,
    calculateSharePercentage,
    getTopStakeholders,
    // Product allocation exports
    productAllocations,
    myAllocations,
    setProductAllocation,
    getProductStats,
    getMyAllocation
  }

  return (
    <StakeholderContext.Provider value={value}>
      {children}
    </StakeholderContext.Provider>
  )
}

export function useStakeholder() {
  const context = useContext(StakeholderContext)
  if (!context) {
    throw new Error('useStakeholder must be used within StakeholderProvider')
  }
  return context
}
