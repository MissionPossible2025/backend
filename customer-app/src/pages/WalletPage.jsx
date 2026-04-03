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
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 620
                }}
              >
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={thStyle}>Order ID</th>
                    <th style={thStyle}>Transaction</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Updated Balance</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isCredit = tx.transactionType === 'credit'
                    const signed = `${isCredit ? '+' : '-'}₹${Number(tx.amount || 0).toFixed(2)}`
                    return (
                      <tr key={tx._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>{tx.orderId ? `#${tx.orderId}` : '-'}</td>
                        <td style={{ ...tdStyle, color: isCredit ? '#059669' : '#dc2626', fontWeight: 600 }}>
                          {isCredit ? 'Cashback Earned' : 'Wallet Used'}
                        </td>
                        <td style={{ ...tdStyle, color: isCredit ? '#059669' : '#dc2626', fontWeight: 700 }}>
                          {signed}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          ₹{Number(tx.updatedBalance || 0).toFixed(2)}
                        </td>
                        <td style={tdStyle}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0.7rem 0.75rem',
  fontSize: '0.86rem',
  color: '#374151',
  fontWeight: 700
}

const tdStyle = {
  textAlign: 'left',
  padding: '0.8rem 0.75rem',
  fontSize: '0.9rem',
  color: '#1f2937'
}

