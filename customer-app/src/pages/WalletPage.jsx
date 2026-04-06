import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserId } from '../utils/userUtils';
import { dispatchBackButton } from '../hooks/useBackButton';

function formatTransactionDate(tx) {
  const raw = tx?.createdAt || tx?.updatedAt
  if (!raw) return { dateStr: '—', timeStr: '', title: '' }
  const when = new Date(raw)
  if (Number.isNaN(when.getTime())) return { dateStr: '—', timeStr: '', title: '' }
  return {
    dateStr: when.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    }),
    timeStr: when.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }),
    title: when.toISOString()
  }
}

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
    <>
      <style>{`
        .wallet-page-inner {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 1.5rem clamp(0.65rem, 4vw, 1.25rem);
          padding-left: max(clamp(0.65rem, 4vw, 1.25rem), env(safe-area-inset-left, 0px));
          padding-right: max(clamp(0.65rem, 4vw, 1.25rem), env(safe-area-inset-right, 0px));
          box-sizing: border-box;
          flex: 1;
          min-height: 0;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .wallet-history-card {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: clamp(0.9rem, 3.5vw, 1.25rem) clamp(0.5rem, 2.5vw, 1rem);
        }
        /* Horizontal scroll only when content is wider than the viewport */
        .wallet-history-scroll {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fafafa;
          box-sizing: border-box;
        }
        .wallet-history-scroll-inner {
          width: 100%;
          min-width: 0;
        }
        .wallet-grid-head,
        .wallet-grid-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(0.35rem, 2.2vw, 0.75rem);
          align-items: stretch;
          box-sizing: border-box;
        }
        .wallet-grid-head {
          padding: clamp(0.55rem, 2vw, 0.75rem) clamp(0.35rem, 1.5vw, 0.5rem);
          border-bottom: 1px solid #e2e8f0;
          background: #f1f5f9;
          font-size: clamp(0.75rem, 2.8vw, 0.9rem);
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          line-height: 1.25;
        }
        .wallet-grid-row {
          padding: clamp(0.6rem, 2.2vw, 0.85rem) clamp(0.35rem, 1.5vw, 0.5rem);
          border-bottom: 1px solid #e2e8f0;
          font-size: clamp(0.88rem, 3.2vw, 1.05rem);
          color: #1e293b;
          line-height: 1.35;
        }
        .wallet-grid-row:last-child {
          border-bottom: none;
        }
        .wallet-cell {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }
        .wallet-cell--date {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.12rem;
          font-size: clamp(0.78rem, 2.6vw, 0.92rem);
          color: #334155;
          font-weight: 500;
          line-height: 1.25;
          text-align: center;
        }
        .wallet-cell--date-sub {
          font-size: 0.82em;
          color: #64748b;
          font-weight: 500;
        }
        .wallet-cell--numeric {
          font-variant-numeric: tabular-nums;
          white-space: normal;
          overflow-wrap: break-word;
        }
        @media (min-width: 400px) {
          .wallet-cell--numeric {
            white-space: nowrap;
          }
        }
        /* Very narrow phones: equal flexible columns, tighter rhythm */
        @media (max-width: 360px) {
          .wallet-grid-head,
          .wallet-grid-row {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: clamp(0.2rem, 1.5vw, 0.4rem);
            padding-left: clamp(0.25rem, 1.5vw, 0.4rem);
            padding-right: clamp(0.25rem, 1.5vw, 0.4rem);
          }
          .wallet-grid-head {
            font-size: 0.68rem;
            letter-spacing: 0.02em;
          }
        }
        /* Extra-narrow containers: minimum readable table width → horizontal scroll only then */
        @media (max-width: 300px) {
          .wallet-history-scroll-inner {
            min-width: 272px;
          }
        }
      `}</style>
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
      <div className="wallet-page-inner">
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
            padding: 'clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 3.5vw, 1.5rem)',
            boxShadow: '0 10px 25px rgba(15,23,42,0.14)',
            marginBottom: '1.5rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
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
          className="wallet-history-card"
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
            marginBottom: '1.5rem'
          }}
        >
          <h2
            style={{
              margin: '0 0 clamp(0.65rem, 2vw, 0.9rem) 0',
              color: '#0f172a',
              fontSize: 'clamp(1.2rem, 4vw, 1.45rem)',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0.45rem'
            }}
          >
            Wallet History
          </h2>

          {loading ? (
            <div style={{ color: '#64748b', fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
              No wallet transactions yet.
            </div>
          ) : (
            <div className="wallet-history-scroll">
              <div className="wallet-history-scroll-inner">
                <div className="wallet-grid-head">
                  <div className="wallet-cell">Date</div>
                  <div className="wallet-cell">Type</div>
                  <div className="wallet-cell">Amount</div>
                  <div className="wallet-cell">Balance</div>
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {transactions.map((tx) => {
                    const isCredit = tx.transactionType === 'credit'
                    const signed = `${isCredit ? '+' : '-'}₹${Number(tx.amount || 0).toFixed(2)}`
                    const { dateStr, timeStr, title } = formatTransactionDate(tx)
                    return (
                      <li key={tx._id} className="wallet-grid-row">
                        <div className="wallet-cell wallet-cell--date" title={title}>
                          <span>{dateStr}</span>
                          {timeStr ? (
                            <span className="wallet-cell--date-sub">{timeStr}</span>
                          ) : null}
                        </div>
                        <div
                          className="wallet-cell"
                          style={{
                            fontWeight: 600,
                            color: isCredit ? '#059669' : '#dc2626'
                          }}
                        >
                          {isCredit ? 'Cashback' : 'Used'}
                        </div>
                        <div
                          className="wallet-cell wallet-cell--numeric"
                          style={{
                            fontWeight: 700,
                            color: isCredit ? '#059669' : '#dc2626'
                          }}
                        >
                          {signed}
                        </div>
                        <div
                          className="wallet-cell wallet-cell--numeric"
                          style={{ fontWeight: 600, color: '#1e293b' }}
                        >
                          ₹{Number(tx.updatedBalance || 0).toFixed(2)}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
