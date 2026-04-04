import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserId } from '../utils/userUtils';
import { dispatchBackButton } from '../hooks/useBackButton';

export default function WalletPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    const handled = dispatchBackButton();
    if (!handled) {
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const user = getCurrentUser();
        const userId = getUserId(user);
        if (!userId) {
          setBalance(0);
          setTransactions([]);
          setLoading(false);
          return;
        }
        const [balanceRes, historyRes] = await Promise.all([
          fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallet/balance/${userId}`
          ),
          fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallet/history/${userId}`
          )
        ]);

        if (!balanceRes.ok) {
          setBalance(0);
        } else {
          const data = await balanceRes.json();
          setBalance(data.walletBalance || 0);
        }

        if (!historyRes.ok) {
          setTransactions([]);
        } else {
          const historyData = await historyRes.json();
          setTransactions(historyData.transactions || []);
        }
      } catch (err) {
        console.error('Error fetching wallet balance', err);
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

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
          maxWidth: 'min(600px, 100%)',
          margin: '0 auto',
          padding: '1.5rem 1.25rem',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
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
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              color: '#0f172a'
            }}
          >
            Wallet
          </h1>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            borderRadius: '16px',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 10px 25px rgba(15,23,42,0.14)',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              fontSize: '0.9rem',
              color: '#dbeafe',
              marginBottom: '0.5rem'
            }}
          >
            Current Wallet Balance:
          </div>
          {loading ? (
            <div style={{ fontSize: '1rem', color: '#e0f2fe' }}>
              Loading balance...
            </div>
          ) : (
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#ffffff'
              }}
            >
              ₹{balance.toFixed(2)}
            </div>
          )}
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              color: '#e0f2fe'
            }}
          >
            Cashback earned from your orders is stored here. You can apply this
            balance on your next order during checkout.
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
            marginBottom: '1.5rem'
          }}
        >
          <h2
            style={{
              margin: '0 0 0.9rem 0',
              color: '#0f172a',
              fontSize: '1.3rem',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0.45rem'
            }}
          >
            Wallet History
          </h2>

          {loading ? (
            <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
              No wallet transactions yet.
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fafafa'
              }}
            >
              {/*
                Strict 20% columns: gap 0 + vertical rules so spacing is visually even.
                Content centered in each band (avoids “huge gap” from right-aligned ₹ in a wide cell).
              */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  columnGap: 0,
                  borderBottom: '1px solid #e2e8f0',
                  background: '#f1f5f9',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  lineHeight: 1.2
                }}
              >
                <div style={{ ...gridHeadCell, borderRight: '1px solid #e2e8f0' }}>Order ID</div>
                <div style={{ ...gridHeadCell, borderRight: '1px solid #e2e8f0' }}>Type</div>
                <div style={{ ...gridHeadCell, borderRight: '1px solid #e2e8f0' }}>Amount</div>
                <div style={{ ...gridHeadCell, borderRight: '1px solid #e2e8f0' }}>Balance</div>
                <div style={gridHeadCell}>Date</div>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }}
              >
                {transactions.map((tx) => {
                  const isCredit = tx.transactionType === 'credit'
                  const signed = `${isCredit ? '+' : '-'}₹${Number(tx.amount || 0).toFixed(2)}`
                  const when = new Date(tx.createdAt)
                  const dateStr = when.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit'
                  })
                  const timeStr = when.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  return (
                    <li
                      key={tx._id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        columnGap: 0,
                        alignItems: 'stretch',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '0.7rem',
                        color: '#1e293b',
                        lineHeight: 1.25
                      }}
                    >
                      <div
                        style={{
                          ...gridBodyCell,
                          borderRight: '1px solid #e2e8f0',
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '0.65rem',
                          color: '#475569'
                        }}
                        title={tx.orderId || ''}
                      >
                        {tx.orderId || '—'}
                      </div>
                      <div
                        style={{
                          ...gridBodyCell,
                          borderRight: '1px solid #e2e8f0',
                          fontWeight: 600,
                          color: isCredit ? '#059669' : '#dc2626'
                        }}
                      >
                        {isCredit ? 'Cashback' : 'Used'}
                      </div>
                      <div
                        style={{
                          ...gridBodyCell,
                          borderRight: '1px solid #e2e8f0',
                          fontWeight: 700,
                          color: isCredit ? '#059669' : '#dc2626',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {signed}
                      </div>
                      <div
                        style={{
                          ...gridBodyCell,
                          borderRight: '1px solid #e2e8f0',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ₹{Number(tx.updatedBalance || 0).toFixed(2)}
                      </div>
                      <div style={gridBodyCell}>
                        {dateStr}
                        <br />
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>{timeStr}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const gridHeadCell = {
  minWidth: 0,
  padding: '0.5rem 0.2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
}

const gridBodyCell = {
  minWidth: 0,
  padding: '0.5rem 0.2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  overflowWrap: 'break-word',
  wordBreak: 'break-word'
}
