import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import SplashScreen from './components/SplashScreen.jsx'
import StatusBarTheme from './components/StatusBarTheme.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import CartPage from './pages/CartPage.jsx'
import BuyNowPage from './pages/BuyNowPage.jsx'
import OrderSummary from './pages/OrderSummary.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import WalletPage from './pages/WalletPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetails from './pages/OrderDetails.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import { setNavigationRef, setLocationRef } from './hooks/useBackButton'

// Component to set up navigation ref for global back button handling
function NavigationSetup() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Set the navigation ref so the back button handler can use it
    setNavigationRef(navigate)
    
    return () => {
      // Clear the ref on unmount
      setNavigationRef(null)
    }
  }, [navigate])

  useEffect(() => {
    // Set the location ref so the back button handler can check current route
    setLocationRef(location)
    
    return () => {
      // Clear the ref on unmount
      setLocationRef(null)
    }
  }, [location])

  return null
}

export default function App() {
  return (
    <>
      <NavigationSetup />
      <StatusBarTheme />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
        <Route path="/product/:productId" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="/buy-now" element={<RequireAuth><BuyNowPage /></RequireAuth>} />
        <Route path="/order-summary" element={<RequireAuth><OrderSummary /></RequireAuth>} />
        <Route path="/order-success" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/order/:id" element={<RequireAuth><OrderDetails /></RequireAuth>} />
        <Route path="/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}


