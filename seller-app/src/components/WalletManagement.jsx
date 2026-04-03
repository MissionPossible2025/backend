import { useEffect, useState } from 'react';
import axios from 'axios';

export default function WalletManagement({ sellerId }) {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      if (!sellerId) return;
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallet/config/${sellerId}`
        );
        setSlabs(res.data.slabs || []);
      } catch (err) {
        console.error('Error fetching wallet config', err);
        setError('Failed to load wallet configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [sellerId]);

  const updateSlabField = (index, field, value) => {
    setSlabs((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const addSlab = () => {
    setSlabs((prev) => [
      ...prev,
      { minAmount: '', maxAmount: '', percentage: '' }
    ]);
  };

  const removeSlab = (index) => {
    setSlabs((prev) => prev.filter((_, i) => i !== index));
  };

  const validateLocal = () => {
    if (!slabs.length) return { valid: true };

    const parsed = slabs.map((s, idx) => {
      const min = Number(s.minAmount);
      const max = Number(s.maxAmount);
      const pct = Number(s.percentage);
      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(pct)) {
        return { idx, error: `Row ${idx + 1}: values must be numbers` };
      }
      if (min < 0 || max <= min) {
        return { idx, error: `Row ${idx + 1}: max must be greater than min and both non-negative` };
      }
      if (pct < 0 || pct > 100) {
        return { idx, error: `Row ${idx + 1}: percentage must be between 0 and 100` };
      }
      return { idx, min, max, pct };
    });

    for (const p of parsed) {
      if (p.error) {
        return { valid: false, message: p.error };
      }
    }

    const ranges = parsed.map((p) => ({
      min: p.min,
      max: p.max
    }));
    ranges.sort((a, b) => a.min - b.min);
    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1];
      const curr = ranges[i];
      if (curr.min < prev.max) {
        return {
          valid: false,
          message:
            'Ranges must not overlap. Ensure each slab starts at or above the previous slab maximum.'
        };
      }
    }
    return { valid: true };
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const validation = validateLocal();
    if (!validation.valid) {
      setError(validation.message || 'Invalid slab configuration');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slabs: slabs
          .map((s) => ({
            minAmount: Number(s.minAmount),
            maxAmount: Number(s.maxAmount),
            percentage: Number(s.percentage)
          }))
          .sort((a, b) => a.minAmount - b.minAmount)
      };
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallet/config/${sellerId}`,
        payload
      );
      setSlabs(res.data.config?.slabs || payload.slabs);
      setSuccess('Wallet configuration saved successfully');
    } catch (err) {
      console.error('Error saving wallet config', err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to save wallet configuration';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        textAlign: 'left'
      }}
    >
      <h2
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.4rem',
          color: '#0f172a'
        }}
      >
        Wallet Management
      </h2>
      <p
        style={{
          margin: '0 0 1rem 0',
          fontSize: '0.9rem',
          color: '#64748b'
        }}
      >
        Configure cashback slabs based on order amount. Customers will receive
        cashback into their wallet after successful orders that fall into these
        ranges.
      </p>

      {loading && <div style={{ marginBottom: '1rem' }}>Loading slabs...</div>}

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '0.9rem'
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        {slabs.map((slab, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto',
              gap: '0.5rem',
              alignItems: 'center',
              padding: '0.75rem',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: 4
                }}
              >
                Min Amount (₹)
              </label>
              <input
                type="number"
                value={slab.minAmount}
                onChange={(e) =>
                  updateSlabField(index, 'minAmount', e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: 4
                }}
              >
                Max Amount (₹)
              </label>
              <input
                type="number"
                value={slab.maxAmount}
                onChange={(e) =>
                  updateSlabField(index, 'maxAmount', e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: 4
                }}
              >
                Cashback (%)
              </label>
              <input
                type="number"
                value={slab.percentage}
                onChange={(e) =>
                  updateSlabField(index, 'percentage', e.target.value)
                }
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
                min={0}
                max={100}
              />
            </div>
            <button
              type="button"
              onClick={() => removeSlab(index)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 6,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: '0.8rem',
                cursor: 'pointer',
                alignSelf: 'flex-end'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between'
        }}
      >
        <button
          type="button"
          onClick={addSlab}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: '1px dashed #6366f1',
            background: 'white',
            color: '#4f46e5',
            fontWeight: 500,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          + Add Slab
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: saving ? '#6b7280' : '#16a34a',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

