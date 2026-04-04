// Utility functions for handling user data across different login structures

// Get current user from localStorage
export const getCurrentUser = () => {
  const userData = localStorage.getItem('user')
  return userData ? JSON.parse(userData) : null
}

// Extract user ID from different user data structures
export const getUserId = (userData) => {
  if (!userData) {
    console.log('getUserId: No user data provided')
    return null
  }

   if (typeof userData !== 'object') {
    console.warn('getUserId: User data is not an object:', userData)
    return null
  }
  
  console.log('getUserId: User data structure:', userData)
  
  // Handle customer login structure: { token, customer: { _id, ... } }
  if (userData?.customer?.['_id']) {
    console.log('getUserId: Found customer ID:', userData.customer._id)
    return userData.customer._id
  }
  
  // Handle user login structure: { token, user: { _id, ... } }
  if (userData?.user?.['_id']) {
    console.log('getUserId: Found user ID:', userData.user._id)
    return userData.user._id
  }
  
  // Handle direct user structure: { _id, ... }
  if (userData?._id) {
    console.log('getUserId: Found direct _id:', userData._id)
    return userData._id
  }
  
  // Handle alternative ID field
  if (userData?.id) {
    console.log('getUserId: Found alternative id:', userData.id)
    return userData.id
  }
  
  console.log('getUserId: No valid user ID found in user data')
  return null
}

// Extract user object from different user data structures
export const getUserObject = (userData) => {
  if (!userData) return null
  if (typeof userData !== 'object') {
    console.warn('getUserObject: User data is not an object:', userData)
    return null
  }
  
  // Handle customer login structure: { token, customer: { _id, ... } }
  if (userData?.customer) {
    return userData.customer
  }
  
  // Handle user login structure: { token, user: { _id, ... } }
  if (userData?.user) {
    return userData.user
  }
  
  // Handle direct user structure: { _id, ... }
  return userData
}

// Check if profile is complete
export const isProfileComplete = (userData) => {
  if (!userData) return false
  
  const user = getUserObject(userData)
  if (!user) return false
  
  // Trust persisted backend-computed flag if explicitly set
  // If backend says profileComplete is true, trust it
  if (user.profileComplete === true) return true
  
  // If backend explicitly says profileComplete is false, trust that too
  // (don't fall back to field checking - backend is source of truth)
  if (user.profileComplete === false) return false

  // Fallback: check fields if profileComplete flag is not set (for backward compatibility)
  return Boolean(
    user.name && user.phone && 
    user.address?.street && user.address?.city && 
    user.address?.state && user.address?.pincode
  )
}

// Authentication utilities for token management with 7-day expiry

/** Decode JWT payload (no signature verification — same as client-side expiry UX). */
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (base64.length % 4)) % 4
    const padded = base64 + '='.repeat(pad)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Store authentication token with expiry timestamp (7 days from now)
export const setAuthToken = (token) => {
  if (!token) return
  
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // 7 days from now
  
  localStorage.setItem('authToken', token)
  localStorage.setItem('authTokenExpiry', expiryDate.toISOString())
}

// Get authentication token (standalone key, or token embedded in persisted user payload)
export const getAuthToken = () => {
  const direct = localStorage.getItem('authToken')
  if (direct) return direct
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const data = JSON.parse(raw)
    return data?.token || null
  } catch {
    return null
  }
}

/** Remove session data when logging out or when token is invalid/expired. */
export const clearSession = () => {
  clearAuthToken()
  localStorage.removeItem('user')
  localStorage.removeItem('lastLogin')
  localStorage.removeItem('lastLoginTime')
}

// Check if authentication token is valid (exists and not expired)
export const isAuthenticated = () => {
  const token = getAuthToken()
  const expiryStr = localStorage.getItem('authTokenExpiry')
  const now = Date.now()

  if (!token) {
    if (localStorage.getItem('user')) {
      clearSession()
    }
    return false
  }

  const payload = decodeJwtPayload(token)
  if (payload?.exp != null && now >= payload.exp * 1000) {
    clearSession()
    return false
  }

  // 7-day app session (set on login via setAuthToken)
  if (!expiryStr) {
    clearSession()
    return false
  }

  const expiryDate = new Date(expiryStr)
  if (Number.isNaN(expiryDate.getTime()) || now > expiryDate.getTime()) {
    clearSession()
    return false
  }

  return true
}

// Clear authentication token and expiry
export const clearAuthToken = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authTokenExpiry')
}

// Get token expiry date (for debugging/info purposes)
export const getTokenExpiry = () => {
  const expiryStr = localStorage.getItem('authTokenExpiry')
  return expiryStr ? new Date(expiryStr) : null
}