import { useEffect } from 'react'
import { useBackButton } from '../hooks/useBackButton'

export default function OrderSuccessPopup({
  isOpen,
  onClose,
  orderId,
  walletUsed = 0,
  walletCredited = 0,
  walletBalance = null
}) {
  useBackButton('order-success-popup', isOpen, onClose)

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.55)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem 1.25rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 22,
                fontWeight: 800
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Order placed successfully
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Thank you for your purchase
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: '1px solid #e5e7eb',
              background: 'white',
              borderRadius: 10,
              padding: '0.35rem 0.55rem',
              cursor: 'pointer',
              color: '#334155',
              fontSize: '1.1rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1rem 1.25rem 1.25rem 1.25rem' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '0.9rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Order ID</div>
              <div style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 700 }}>
                {orderId || 'PENDING'}
              </div>
            </div>
          </div>

          {(walletUsed > 0 || walletCredited > 0 || walletBalance != null) && (
            <div
              style={{
                border: '1px solid #bbf7d0',
                background: '#ecfdf5',
                borderRadius: 12,
                padding: '0.9rem',
                display: 'grid',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ fontWeight: 700, color: '#166534' }}>Wallet</div>

              {walletUsed > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ color: '#166534' }}>Used in this order</div>
                  <div style={{ fontWeight: 700, color: '#166534' }}>₹{walletUsed.toFixed(2)}</div>
                </div>
              )}

              {walletCredited > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ color: '#166534' }}>Credited cashback</div>
                  <div style={{ fontWeight: 800, color: '#0f766e' }}>₹{walletCredited.toFixed(2)}</div>
                </div>
              )}

              {walletBalance != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ color: '#166534' }}>Current balance</div>
                  <div style={{ fontWeight: 700, color: '#166534' }}>₹{Number(walletBalance).toFixed(2)}</div>
                </div>
              )}

              {walletCredited > 0 && (
                <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.25rem' }}>
                  This amount can be used in your next order.
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.9rem 1rem',
              borderRadius: 12,
              border: 'none',
              background: '#059669',
              color: 'white',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  )
}

