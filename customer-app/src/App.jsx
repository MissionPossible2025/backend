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
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetails from './pages/OrderDetails.jsx'
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/buy-now" element={<BuyNowPage />} />
        <Route path="/order-summary" element={<OrderSummary />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/order/:id" element={<OrderDetails />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}


