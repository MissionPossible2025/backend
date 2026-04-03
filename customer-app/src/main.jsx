import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import App from './App.jsx'
import './styles/global.css'
import { initBackButtonListener } from './hooks/useBackButton'

// Initialize back button listener
initBackButtonListener()

// Configure native status bar: white background, dark icons, content not behind it
function initStatusBar() {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {})
    StatusBar.setStyle({ style: Style.Light }).catch(() => {})
  }
}
initStatusBar()

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)


