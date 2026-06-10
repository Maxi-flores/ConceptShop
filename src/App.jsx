import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import ChatWidget from './components/ChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import RegisterPage from './pages/RegisterPage'
import PricingPage from './pages/PricingPage'
import PaymentPage from './pages/PaymentPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import StakeholdersPage from './pages/StakeholdersPage'
import MarketingPage from './pages/MarketingPage'
import ForecastingPage from './pages/ForecastingPage'
import ShippingPage from './pages/ShippingPage'
import StockPage from './pages/StockPage'
import SettingsPage from './pages/SettingsPage'
import InvitePage from './pages/InvitePage'
import InviteMembersPage from './pages/InviteMembersPage'

export default function App() {
  return (
    <>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/invite/code" element={<InvitePage />} />
      <Route path="/invite/:code" element={<InvitePage />} />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      <Route path="/invite/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      <Route path="/invite/register/:inviteCode" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/payment" element={
        <PublicRoute>
          <PaymentPage />
        </PublicRoute>
      } />
      <Route path="/register/:inviteCode" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <MainLayout>
            <OrdersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/stakeholders" element={
        <ProtectedRoute>
          <MainLayout>
            <StakeholdersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/invite-members" element={
        <ProtectedRoute>
          <MainLayout>
            <InviteMembersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/marketing" element={
        <ProtectedRoute>
          <MainLayout>
            <MarketingPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/forecasting" element={
        <ProtectedRoute>
          <MainLayout>
            <ForecastingPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/shipping" element={
        <ProtectedRoute>
          <MainLayout>
            <ShippingPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute>
          <MainLayout>
            <StockPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ChatWidget />
    </>
  )
}
