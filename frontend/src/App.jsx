import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layout Components
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Public Pages
import LandingPage from './pages/LandingPage'
import AboutUs from './pages/public/AboutUs'
import Careers from './pages/public/Careers'
import Blog from './pages/public/Blog'
import HelpCenter from './pages/public/HelpCenter'
import Contact from './pages/public/Contact'
import TermsOfUse from './pages/public/TermsOfUse'
import Privacy from './pages/public/Privacy'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Profile Page
import Profile from './pages/Profile'

// Landlord Pages
import LandlordProperties from './pages/landlord/Properties'
import PropertyHub from './pages/landlord/PropertyHub'
import LandlordServices from './pages/landlord/Services'
import HostOnboarding from './pages/landlord/HostOnboarding'
import EditProperty from './pages/landlord/EditProperty'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminProperties from './pages/admin/Properties'
import AdminServiceBookings from './pages/admin/ServiceBookings'
import AdminAnalytics from './pages/admin/Analytics'
import AdminAssetPerformance from './pages/admin/AssetPerformance'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />

  return children
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Legacy rental routes are intentionally retired. */}
        <Route path="/legacy" element={<Navigate to="/" replace />} />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route path="/properties/:id" element={<Navigate to="/" replace />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route
        path="/landlord/*"
        element={
          <ProtectedRoute allowedRoles={['landlord', 'admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/landlord/properties" replace />} />
        <Route path="properties" element={<LandlordProperties />} />
        <Route path="properties/new" element={<HostOnboarding />} />
        <Route path="properties/:id" element={<PropertyHub />} />
        <Route path="properties/:id/edit" element={<EditProperty />} />
        <Route path="services" element={<LandlordServices />} />
        <Route path="bookings" element={<Navigate to="/landlord/services" replace />} />
        <Route path="dashboard" element={<Navigate to="/landlord/properties" replace />} />
      </Route>

      {/* Tenant/rental functionality is no longer part of the active product. */}
      <Route path="/tenant/*" element={<Navigate to="/" replace />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="properties/new" element={<HostOnboarding />} />
        <Route path="properties/:id/edit" element={<Navigate to="/admin/properties" replace />} />
        <Route path="service-bookings" element={<AdminServiceBookings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="performance" element={<AdminAssetPerformance />} />
        <Route path="bookings" element={<Navigate to="/admin/service-bookings" replace />} />
      </Route>

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
