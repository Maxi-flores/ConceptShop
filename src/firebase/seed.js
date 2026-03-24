import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

// Seed initial data for ConceptSHOP
export const seedInitialData = async () => {
  console.log('Seeding ConceptSHOP data...')

  try {
    // 1. Create Invite Codes
    const inviteCodes = [
      { code: 'CS-FOUNDER01', maxUses: 10, assignedRole: 'admin', note: 'Founder invite' },
      { code: 'CS-STAKE2024', maxUses: 50, assignedRole: 'stakeholder', note: 'General stakeholder invite' },
      { code: 'CS-VIPGOLD99', maxUses: 5, assignedRole: 'stakeholder', note: 'VIP Gold tier invite' }
    ]

    for (const invite of inviteCodes) {
      await addDoc(collection(db, 'inviteCodes'), {
        ...invite,
        used: false,
        useCount: 0,
        usedBy: [],
        createdBy: 'system',
        createdAt: serverTimestamp()
      })
    }
    console.log('✓ Invite codes created')

    // 2. Create Product Categories
    const categories = ['Electronics', 'Office Supplies', 'Industrial', 'Raw Materials', 'Packaging']
    for (const name of categories) {
      await addDoc(collection(db, 'categories'), {
        name,
        createdAt: serverTimestamp()
      })
    }
    console.log('✓ Categories created')

    // 3. Create Sample Products with Bulk Pricing
    const products = [
      {
        name: 'Industrial LCD Monitor 27"',
        description: 'High-quality 27-inch LCD monitor for industrial applications. 4K resolution, anti-glare coating.',
        category: 'Electronics',
        basePrice: 299.99,
        stock: 500,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 10, discount: 5, discountType: 'percentage' },
          { minQuantity: 25, discount: 10, discountType: 'percentage' },
          { minQuantity: 50, discount: 15, discountType: 'percentage' },
          { minQuantity: 100, discount: 22, discountType: 'percentage' }
        ]
      },
      {
        name: 'Premium Office Chair - Ergonomic',
        description: 'Ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.',
        category: 'Office Supplies',
        basePrice: 449.00,
        stock: 200,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 5, discount: 8, discountType: 'percentage' },
          { minQuantity: 20, discount: 15, discountType: 'percentage' },
          { minQuantity: 50, discount: 25, discountType: 'percentage' }
        ]
      },
      {
        name: 'Stainless Steel Fasteners Kit (1000pc)',
        description: 'Professional grade stainless steel fasteners. Includes screws, bolts, nuts, and washers.',
        category: 'Industrial',
        basePrice: 89.99,
        stock: 1000,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 10, discount: 10, discountType: 'percentage' },
          { minQuantity: 50, discount: 20, discountType: 'percentage' },
          { minQuantity: 100, discount: 30, discountType: 'percentage' },
          { minQuantity: 250, discount: 40, discountType: 'percentage' }
        ]
      },
      {
        name: 'Copper Wire Spool (500m)',
        description: '99.9% pure copper wire, 2.5mm diameter. Ideal for electrical installations.',
        category: 'Raw Materials',
        basePrice: 245.00,
        stock: 300,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 5, discount: 5, discountType: 'percentage' },
          { minQuantity: 20, discount: 12, discountType: 'percentage' },
          { minQuantity: 50, discount: 18, discountType: 'percentage' }
        ]
      },
      {
        name: 'Cardboard Shipping Boxes (Pack of 50)',
        description: 'Heavy-duty corrugated cardboard boxes. 40x30x25cm. Double-wall construction.',
        category: 'Packaging',
        basePrice: 65.00,
        stock: 2000,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 10, discount: 8, discountType: 'percentage' },
          { minQuantity: 50, discount: 15, discountType: 'percentage' },
          { minQuantity: 100, discount: 25, discountType: 'percentage' },
          { minQuantity: 500, discount: 35, discountType: 'percentage' }
        ]
      },
      {
        name: 'Wireless Barcode Scanner',
        description: 'Industrial wireless barcode scanner. 2D/QR code support. 100m range.',
        category: 'Electronics',
        basePrice: 189.00,
        stock: 150,
        reservedStock: 0,
        soldCount: 0,
        status: 'active',
        bulkPricing: [
          { minQuantity: 5, discount: 7, discountType: 'percentage' },
          { minQuantity: 15, discount: 12, discountType: 'percentage' },
          { minQuantity: 30, discount: 18, discountType: 'percentage' }
        ]
      }
    ]

    for (const product of products) {
      await addDoc(collection(db, 'products'), {
        ...product,
        images: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    console.log('✓ Products created')

    // 4. Create Sample Price History (for forecasting)
    const priceHistoryData = []
    const now = new Date()
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Simulate price fluctuations
      const basePrice = 299.99
      const trend = -0.05 * (90 - i) / 90 // Slight downward trend
      const noise = (Math.random() - 0.5) * 10
      const price = basePrice + trend * basePrice + noise

      priceHistoryData.push({
        productId: 'sample-monitor',
        price: Math.round(price * 100) / 100,
        quantity: Math.floor(Math.random() * 50) + 10,
        source: 'order',
        timestamp: date
      })
    }

    for (const data of priceHistoryData.slice(0, 30)) { // Just add 30 entries
      await addDoc(collection(db, 'priceHistory'), data)
    }
    console.log('✓ Price history created')

    // 5. Create Sample Marketing Campaigns
    const campaigns = [
      {
        name: 'Spring Bulk Buy Event',
        description: 'Special discounts on bulk orders for spring season',
        type: 'email',
        status: 'active',
        budget: 5000,
        metrics: {
          impressions: 12500,
          clicks: 890,
          conversions: 45,
          revenue: 18500,
          spend: 2400
        }
      },
      {
        name: 'Stakeholder Referral Program',
        description: 'Earn bonus shares by referring new stakeholders',
        type: 'referral',
        status: 'active',
        budget: 10000,
        metrics: {
          impressions: 8200,
          clicks: 1240,
          conversions: 78,
          revenue: 32000,
          spend: 4500
        }
      }
    ]

    for (const campaign of campaigns) {
      await addDoc(collection(db, 'campaigns'), {
        ...campaign,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    console.log('✓ Marketing campaigns created')

    console.log('\n✅ Seed complete!')
    console.log('\nInvite codes created:')
    console.log('  - CS-FOUNDER01 (Admin, 10 uses)')
    console.log('  - CS-STAKE2024 (Stakeholder, 50 uses)')
    console.log('  - CS-VIPGOLD99 (VIP, 5 uses)')

    return true
  } catch (error) {
    console.error('Error seeding data:', error)
    throw error
  }
}

export default seedInitialData
