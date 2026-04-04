import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../utils/userUtils'

/**
 * Redirects to /auth when the session is missing or expired (7-day + JWT exp checks live in isAuthenticated).
 */
export default function RequireAuth({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [allowed, setAllowed] = useState(() => isAuthenticated())

  useEffect(() => {
    const ok = isAuthenticated()
    setAllowed(ok)
    if (!ok) {
      navigate('/auth', { replace: true, state: { from: location.pathname } })
    }
  }, [navigate, location.pathname])

  // Re-check when the tab regains focus (session may have expired while in background)
  useEffect(() => {
    const recheck = () => {
      const ok = isAuthenticated()
      setAllowed(ok)
      if (!ok) navigate('/auth', { replace: true })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') recheck()
    }
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [navigate])

  if (!allowed) {
    return null
  }

  return children
}
