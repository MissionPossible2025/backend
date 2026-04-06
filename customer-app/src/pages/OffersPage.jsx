import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dispatchBackButton } from '../hooks/useBackButton'

const apiBase = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function formatRupee(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return `₹${x.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function OffersPage() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleBack = () => {
    const handled = dispatchBackButton()
    if (!handled) navigate(-1)
  }

  const loadOffers = useCallback(async (opts = {}) => {
    const background = opts.background === true
    if (!background) setLoading(true)
    setError('')
    try {
      const res = await fetch(`${apiBase()}/wallet/cashback-offers`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Could not load offers')
      }
      const data = await res.json()
      setOffers(Array.isArray(data.offers) ? data.offers : [])
    } catch (e) {
      setError(e.message || 'Failed to load offers')
      setOffers([])
    } finally {
      if (!background) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOffers()
  }, [loadOffers])

  // After seller updates/clears slabs in wallet management, refetch when user returns to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadOffers({ background: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadOffers])

  return (
    <div
      style={{
        height: '100dvh',
        background: '#f8fafc',
        paddingBottom: 'var(--safe-bottom)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          padding:
            '1.5rem max(0.75rem, env(safe-area-inset-right)) 1.5rem max(0.75rem, env(safe-area-inset-left))',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
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
          <h1 style={{ margin: 0, fontSize: 'clamp(1.35rem, 4vw, 1.5rem)', color: '#0f172a' }}>
            Offers
          </h1>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg,#059669,#047857)',
            borderRadius: '16px',
            padding: 'clamp(1.25rem, 4vw, 1.75rem)',
            boxShadow: '0 10px 25px rgba(5,150,105,0.2)',
            marginBottom: '1.5rem',
            color: '#ecfdf5'
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.35rem', opacity: 0.95 }}>
            Wallet cashback
          </div>
          <p style={{ margin: 0, fontSize: 'clamp(0.88rem, 2.8vw, 1rem)', lineHeight: 1.55, opacity: 0.98 }}>
            When you place an order, cashback is added to your wallet based on the order value .Below are the current minimum and maximum order amounts and the
            cashback percentage for each tier.
          </p>
        </div>

        {loading && (
          <div style={{ color: '#64748b', fontSize: '1.05rem', textAlign: 'center', padding: '2rem' }}>
            Loading offers…
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && offers.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              color: '#64748b',
              boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
              border: '1px solid #e2e8f0'
            }}
          >
            No cashback tiers are published yet. Check back after the store configures wallet offers.
          </div>
        )}

        {!loading &&
          offers.map((block, blockIdx) => (
            <div
              key={block.sellerId || blockIdx}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: 'clamp(1rem, 3vw, 1.35rem)',
                marginBottom: '1.25rem',
                boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
                border: '1px solid #e2e8f0',
                boxSizing: 'border-box'
              }}
            >
              {offers.length > 1 && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '1rem'
                  }}
                >
                  Store {blockIdx + 1}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(block.slabs || [])
                  .slice()
                  .sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0))
                  .map((slab, i) => (
                    <div
                      key={`${slab.minAmount}-${slab.maxAmount}-${i}`}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'stretch',
                        gap: '0.75rem',
                        padding: 'clamp(0.85rem, 3vw, 1.1rem)',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div
                        style={{
                          flex: '1 1 140px',
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Order from
                        </span>
                        <span style={{ fontSize: 'clamp(1rem, 3.2vw, 1.15rem)', fontWeight: 700, color: '#0f172a' }}>
                          {formatRupee(slab.minAmount)}
                        </span>
                      </div>
                      <div
                        style={{
                          flex: '1 1 140px',
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Order up to
                        </span>
                        <span style={{ fontSize: 'clamp(1rem, 3.2vw, 1.15rem)', fontWeight: 700, color: '#0f172a' }}>
                          {formatRupee(slab.maxAmount)}
                        </span>
                      </div>
                      <div
                        style={{
                          flex: '1 1 120px',
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0.35rem 0'
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Cashback
                        </span>
                        <span
                          style={{
                            fontSize: 'clamp(1.35rem, 4vw, 1.65rem)',
                            fontWeight: 800,
                            color: '#059669',
                            lineHeight: 1.1
                          }}
                        >
                          {(() => {
                            const p = Number(slab.percentage)
                            const dec = Number.isFinite(p) && Math.abs(p % 1) > 1e-6
                            return `${dec ? p.toFixed(1) : Math.round(p)}%`
                          })()}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                          of eligible order value
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
