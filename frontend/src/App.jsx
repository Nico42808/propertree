import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layout Components
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Public Pages
import LandingPage from './pages/LandingPage'
import PropertySearch from './pages/PropertySearch'
import PropertyDetail from './pages/PropertyDetail'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Profile Page (accessible to all authenticated users)
import Profile from './pages/Profile'

// Landlord Pages
import LandlordDashboard from './pages/landlord/Dashboard'
import LandlordProperties from './pages/landlord/Properties'
import LandlordBookings from './pages/landlord/Bookings'
import LandlordServices from './pages/landlord/Services'
import LandlordExpenses from './pages/landlord/Expenses'
import HostOnboarding from './pages/landlord/HostOnboarding'
import EditProperty from './pages/landlord/EditProperty'

// Tenant Pages
import MyBookings from './pages/tenant/MyBookings'
import TenantFavorites from './pages/tenant/Favorites'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminProperties from './pages/admin/Properties'
import AdminBookings from './pages/admin/Bookings'
import AdminServiceBookings from './pages/admin/ServiceBookings'
import AdminAnalytics from './pages/admin/Analytics'
import AdminAssetPerformance from './pages/admin/AssetPerformance'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<PropertySearch />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Landlord Routes */}
      <Route
        path="/landlord/*"
        element={
          <ProtectedRoute allowedRoles={['landlord', 'admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/landlord/dashboard" replace />} />
        <Route path="dashboard" element={<LandlordDashboard />} />
        <Route path="properties" element={<LandlordProperties />} />
        <Route path="properties/new" element={<HostOnboarding />} />
        <Route path="properties/:id/edit" element={<EditProperty />} />
        <Route path="bookings" element={<LandlordBookings />} />
        <Route path="services" element={<LandlordServices />} />
        <Route path="expenses" element={<LandlordExpenses />} />
        <Route path="onboarding" element={<HostOnboarding />} />
      </Route>

      {/* Tenant Routes */}
      <Route
        path="/tenant/*"
        element={
          <ProtectedRoute allowedRoles={['tenant', 'admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tenant/bookings" replace />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="favorites" element={<TenantFavorites />} />
      </Route>

      {/* Admin Routes */}
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
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="service-bookings" element={<AdminServiceBookings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="performance" element={<AdminAssetPerformance />} />
      </Route>

      {/* Profile Route - Accessible to all authenticated users */}
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

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
