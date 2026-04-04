import footerLogo from '../assets/murugar-logo.svg'


import { useState, useEffect , useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import UserProfileIcon from '../components/UserProfileIcon'
import ProfileModal from '../components/ProfileModal'
import Sidebar from '../components/Sidebar'
import ProductsList from '../components/ProductsList'
import { useCart } from '../hooks/useCart'
import { getCurrentUser, getUserId } from '../utils/userUtils'
import resolveImageUrl from '../utils/imageUtils'

// Hook to fetch logo from ImageKit
const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${apiUrl}/logo`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.url) {
            setLogoUrl(data.data.url)
          } else {
            // Fallback to local logo if ImageKit logo not found
            setLogoUrl(resolveImageUrl('/uploads/dreamsync-logo.svg'))
          }
        } else {
          // Fallback to local logo if API fails
          setLogoUrl(resolveImageUrl('/uploads/dreamsync-logo.svg'))
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
        // Fallback to local logo on error
        setLogoUrl(resolveImageUrl('/uploads/dreamsync-logo.svg'))
      } finally {
        setLoading(false)
      }
    }

    fetchLogo()
  }, [])

  return { logoUrl, loading }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  
  const userPayload = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const name = userPayload?.user?.name || userPayload?.customer?.name || 'Customer'
  const [searchTerm, setSearchTerm] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { fetchCartCount } = useCart()
  // const { logoUrl, loading: logoLoading } = useLogo()



  // Load cart count on component mount
  useEffect(() => {
    fetchCartCount()
  }, [])

  // Measure header height for proper content spacing
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [])

  return (
    <div
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        background: '#ffffff',
        paddingBottom: 'var(--safe-bottom)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header with Profile Icon, Menu Button, and Search Bar */}
      <div
        ref={headerRef}
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 0',
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 100,
          width: '100%',
          isolation: 'isolate',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      >
        <div style={{
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1.25rem'
}}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Menu/Dashboard Icon Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.borderColor = '#e5e7eb'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>☰</span>
              </button>
              <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '600' }}>
                Hello, {name}
              </h1>
            </div>
            <UserProfileIcon onProfileClick={() => setShowProfileModal(true)} />
          </div>
          
          {/* Search Bar */}
          <div>
            <SearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search products, categories ..."
            />
          </div>
        </div>
      </div>

      {/* Scrollable content area - clipped below header */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          marginTop: `${headerHeight || 150}px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{
  maxWidth: '1200px',
  margin: '0 auto',
  padding: 'clamp(1.25rem, 3vw, 2rem) 1.25rem'
}}>


          <ProductsList searchTerm={searchTerm} />
        </div>
      {/* Footer */}
      <footer style={{ background: '#f1f5f9', padding: '1.5rem 0', marginTop: 'auto' }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          textAlign: 'center'
        }}>
         
            <img
            src={footerLogo}
            alt="Sri Kumaran Distributors"
              style={{ height: '52px', width: 'auto' }}
            />
          
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>Sri Kumaran Distributors</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000000' }}>Modakurichi</span>
          </div>
        </div>
      </footer>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </div>
  )
}


