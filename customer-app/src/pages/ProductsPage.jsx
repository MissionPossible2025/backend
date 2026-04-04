import { useNavigate, useLocation } from 'react-router-dom'
import ProductsList from '../components/ProductsList'
import { dispatchBackButton } from '../hooks/useBackButton'

export default function ProductsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get search term from location state if passed from Dashboard
  const searchTerm = location.state?.searchTerm || ''

  const handleBack = () => {
    // Close any open UI first
    const handled = dispatchBackButton()
    // Only navigate if no UI was closed
    if (!handled) {
      if (location.state?.backToDashboard) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate(-1)
      }
    }
  }

  return (
    <div style={{ 
      height: '100dvh', 
      background: '#f8fafc', 
      paddingBottom: 'var(--safe-bottom)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ 
        maxWidth: 'min(1200px, 100%)', 
        margin: '0 auto', 
        padding: '1.25rem',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <h1 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Products</h1>
            </div>
          </div>
        </div>

        <ProductsList searchTerm={searchTerm} />
      </div>
    </div>
  )
}
