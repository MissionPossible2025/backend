import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'

// Global UI stack to track open UI components
let uiStack = []
let backButtonHandler = null
// Flag for native code to check synchronously
let hasOpenUIFlag = false
// Global navigation ref for React Router
let navigationRef = null
// Global location ref for React Router
let locationRef = null
// Root routes that should exit the app when back is pressed
const ROOT_ROUTES = ['/auth', '/dashboard']

/**
 * Check if there are any open UI components
 * @returns {boolean} True if there are open UIs
 */
export function hasOpenUI() {
  return uiStack.length > 0
}

/**
 * Get the most recent UI component
 * @returns {Object|null} The most recent UI component or null
 */
export function getMostRecentUI() {
  return uiStack.length > 0 ? uiStack[uiStack.length - 1] : null
}

/**
 * Register a UI component to the stack
 * @param {string} id - Unique identifier for the UI component
 * @param {Function} onClose - Function to call when back button is pressed
 * @returns {Function} Unregister function
 */
/**
 * Update the native flag for open UIs
 */
function updateNativeFlag() {
  hasOpenUIFlag = uiStack.length > 0
  // Update native interface if available
  if (typeof window !== 'undefined' && window.BackButtonInterface) {
    try {
      window.BackButtonInterface.setHasOpenUI(hasOpenUIFlag)
    } catch (e) {
      // Interface might not be available yet
    }
  }
}

export function registerUI(id, onClose) {
  // Remove if already exists
  uiStack = uiStack.filter(item => item.id !== id)
  
  // Add to stack
  uiStack.push({ id, onClose, timestamp: Date.now() })
  updateNativeFlag()
  
  console.log('[BackButton] Registered UI:', id, 'Stack size:', uiStack.length)
  
  // Return unregister function
  return () => {
    uiStack = uiStack.filter(item => item.id !== id)
    updateNativeFlag()
    console.log('[BackButton] Unregistered UI:', id, 'Stack size:', uiStack.length)
  }
}

/**
 * Set the navigation ref for React Router navigation
 * @param {Object} navigate - React Router's navigate function
 */
export function setNavigationRef(navigate) {
  navigationRef = navigate
  console.log('[BackButton] Navigation ref set')
}

/**
 * Set the location ref for React Router location tracking
 * @param {Object} location - React Router's location object
 */
export function setLocationRef(location) {
  locationRef = location
}

/**
 * Handle back button press
 */
function handleBackButton() {
  if (uiStack.length > 0) {
    // Get the most recently opened UI (last in stack)
    const mostRecent = uiStack[uiStack.length - 1]
    console.log('[BackButton] Closing UI:', mostRecent.id)
    
    // Call its close handler
    if (mostRecent.onClose) {
      mostRecent.onClose()
    }
    
    // Remove from stack
    uiStack = uiStack.filter(item => item.id !== mostRecent.id)
    updateNativeFlag()
    
    // Prevent default back behavior
    return true
  }
  
  // No UI to close, handle React Router navigation
  updateNativeFlag()
  
  // Check if we're on a root route - if so, exit the app
  if (locationRef) {
    const currentPath = locationRef.pathname
    if (ROOT_ROUTES.includes(currentPath)) {
      console.log('[BackButton] On root route, exiting app:', currentPath)
      // Exit app for root routes
      App.exitApp().catch(err => {
        console.error('[BackButton] Error exiting app:', err)
      })
      return true // Prevent default behavior
    }
  }
  
  // If navigation ref is available, use React Router navigation
  if (navigationRef) {
    try {
      // Check if we can go back in history
      const canGoBack = window.history.length > 1
      
      if (canGoBack) {
        console.log('[BackButton] Navigating back via React Router')
        navigationRef(-1)
        return true // Prevent default behavior
      } else {
        console.log('[BackButton] Cannot go back, at root route')
        return false // Allow default behavior (exit app)
      }
    } catch (error) {
      console.error('[BackButton] Error navigating:', error)
      return false
    }
  }
  
  // No navigation ref available, allow default behavior
  return false
}

/**
 * Handle back button press (called from native or browser)
 * Exported for use in header back buttons
 */
export function dispatchBackButton() {
  const handled = handleBackButton()
  if (handled) {
    // UI was closed, navigation handled, or app exited - prevent further back button handling
    return true
  }
  return false
}

// Expose to window for native bridge calls
if (typeof window !== 'undefined') {
  window.dispatchBackButton = dispatchBackButton
  window.hasOpenUI = () => hasOpenUIFlag
}

/**
 * Initialize back button listener
 */
export function initBackButtonListener() {
  if (backButtonHandler) {
    return // Already initialized
  }
  
  // Initialize native flag
  updateNativeFlag()
  
  // Check if running on native platform
  App.addListener('backButton', ({ canGoBack }) => {
    const handled = dispatchBackButton()
    if (handled) {
      // UI was closed or navigation handled, prevent default back behavior
      return
    }
    
    // No UI to close and navigation not handled - check if we can exit
    if (uiStack.length === 0) {
      // Check if we're on a root route
      if (locationRef) {
        const currentPath = locationRef.pathname
        if (ROOT_ROUTES.includes(currentPath)) {
          // On root route, exit app
          console.log('[BackButton] On root route, exiting app:', currentPath)
          App.exitApp()
          return
        }
      }
      
      // Check if we can navigate back using React Router
      const canNavigateBack = navigationRef && window.history.length > 1
      
      if (!canNavigateBack && !canGoBack) {
        // Can't go back in navigation and no UIs open, exit app
        console.log('[BackButton] Exiting app - no navigation available')
        App.exitApp()
      }
      // If navigation was handled by React Router, we already returned above
    }
  }).then(listener => {
    backButtonHandler = listener
    console.log('[BackButton] Listener initialized')
  }).catch(err => {
    console.warn('[BackButton] Failed to initialize listener (may be running in browser):', err)
  })
  
  // Also handle browser back button (for web/desktop testing)
  // This is mainly for development/testing in browser
  if (typeof window !== 'undefined' && window.history) {
    window.addEventListener('popstate', (event) => {
      // Only handle if there are open UIs - otherwise let React Router handle navigation
      if (uiStack.length > 0) {
        const handled = dispatchBackButton()
        if (handled) {
          // UI was closed, prevent the navigation by pushing state back
          window.history.pushState(null, '', window.location.href)
        }
      }
      // If no UIs are open, allow the popstate to proceed normally (React Router will handle it)
    })
  }
}

/**
 * Hook to register/unregister a UI component with the back button handler
 * @param {string} id - Unique identifier for the UI component
 * @param {boolean} isOpen - Whether the UI is currently open
 * @param {Function} onClose - Function to call when back button is pressed
 */
export function useBackButton(id, isOpen, onClose) {
  const unregisterRef = useRef(null)
  
  useEffect(() => {
    // Note: initBackButtonListener() is called at app startup in main.jsx
    // No need to initialize here
    
    if (isOpen && onClose) {
      // Register UI component
      unregisterRef.current = registerUI(id, onClose)
    } else if (unregisterRef.current) {
      // Unregister when closed
      unregisterRef.current()
      unregisterRef.current = null
    }
    
    // Cleanup on unmount
    return () => {
      if (unregisterRef.current) {
        unregisterRef.current()
        unregisterRef.current = null
      }
    }
  }, [id, isOpen, onClose])
}

