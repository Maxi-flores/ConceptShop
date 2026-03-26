import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './LoadingSpinner'

/**
 * PublicRoute component - Guards routes that should only be accessible when NOT authenticated
 * (e.g., login, register pages)
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @returns {React.ReactNode} The public content or redirects to dashboard if already authenticated
 *
 * @example
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 */
export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
