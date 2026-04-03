import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

/**
 * White status bar with dark icons on all routes (native platforms).
 * Re-applies on every route change to ensure consistency.
 */
function applyNativeStatusBar() {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
  StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {})
  StatusBar.setStyle({ style: Style.Light }).catch(() => {})
}

export default function StatusBarTheme() {
  const location = useLocation()

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      applyNativeStatusBar()
    }

    // Web: update meta tags for PWA/preview
    const themeColorMeta = document.getElementById('theme-color')
    const appleMeta = document.getElementById('apple-status-bar-style')
    if (themeColorMeta) themeColorMeta.setAttribute('content', '#ffffff')
    if (appleMeta) appleMeta.setAttribute('content', 'default')
  }, [location.pathname])

  return null
}
