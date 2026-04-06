import { useState } from 'react'
import { setAuthToken, clearSession } from '../utils/userUtils'
import { getApiUrl } from '../utils/apiConfig'

export default function AuthPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
      padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      paddingTop: 'clamp(1.25rem, 3vw, 2.5rem)',
      paddingBottom: 'calc(var(--safe-bottom) + clamp(1.25rem, 3vw, 2.5rem))'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '2rem',
        color: '#000000',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>
          Access DaiLynk
        </h1>

        <p style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          Enter your details to access the store
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            setLoading(true)

            try {
              const form = new FormData(e.currentTarget)
              const phone = form.get('phone')
              const name = form.get('name')

              // ================= CHECK API =================
              const checkUrl = `${getApiUrl()}/customers/check`
              console.log("🔵 CHECK API:", checkUrl)

              const checkRes = await fetch(checkUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
              })

              const checkText = await checkRes.text()
              console.log("🔵 CHECK RAW:", checkText)

              const checkData = JSON.parse(checkText)

              if (!checkRes.ok) {
                throw new Error('Entered Phone number is not registered by the seller')
              }

              // ================= CLEAN OLD SESSION =================
              const lastLogin = localStorage.getItem('lastLogin')
              if (lastLogin) {
                const lastLoginDate = new Date(lastLogin)
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                if (lastLoginDate < threeMonthsAgo) {
                  clearSession()
                }
              }

              // ================= LOGIN API =================
              const loginUrl = `${getApiUrl()}/customers/login`

              console.log("🔥 BASE API:", getApiUrl())
              console.log("🔥 LOGIN API:", loginUrl)

              const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, name })
              })

              console.log("🔥 STATUS:", res.status)

              const text = await res.text()
              console.log("🔥 RAW RESPONSE:", text)

              const data = JSON.parse(text)

              if (!res.ok) throw new Error(data.error || 'Login failed')

              console.log("🔥 SUCCESS:", data)

              // ================= SAVE USER =================
              const userData = {
                ...data,
                customer: {
                  ...data.customer,
                  profileComplete:
                    data.customer?.profileComplete !== undefined
                      ? data.customer.profileComplete
                      : false
                }
              }

              localStorage.setItem('user', JSON.stringify(userData))
              localStorage.setItem('lastLogin', new Date().toISOString())
              localStorage.setItem('lastLoginTime', new Date().toISOString())

              if (data.token) {
                setAuthToken(data.token)
              }

              window.location.href = '/dashboard'

            } catch (err) {
              console.error("❌ ERROR:", err.message)
              setError(err.message)
            } finally {
              setLoading(false)
            }
          }}
          style={{ display: 'grid', gap: '0.85rem' }}
        >
          <div>
            <label>Name</label>
            <input name="name" type="text" required placeholder="Enter your name" style={inputStyle} />
          </div>

          <div>
            <label>Phone Number</label>
            <input name="phone" type="tel" required placeholder="Enter phone" style={inputStyle} />
          </div>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <button type="submit" style={primaryButtonStyle}>
            {loading ? 'Accessing...' : 'Access Store'}
          </button>
        </form>

        <div style={noteStyle}>
          <b>Note: </b> Only phone numbers by the store owner can access this app. If you can't access , please contact the store owner to get access.
        </div>
      </div>
    </div>
  )
}

// ================= STYLES =================

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  outline: 'none',
}

const primaryButtonStyle = {
  marginTop: '0.5rem',
  width: '100%',
  padding: '0.95rem 1rem',
  borderRadius: '10px',
  border: 'none',
  background: '#000000',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
}

const errorStyle = {
  color: '#dc2626',
  padding: '0.75rem',
  backgroundColor: '#fef2f2',
  borderRadius: '8px'
}

const noteStyle = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#eff6ff',
  borderRadius: '8px'
}