import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { restoreAuthFromStorage } from './lib/api'
import { registerSW } from 'virtual:pwa-register'

restoreAuthFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA Service Worker registration (auto update)
if (import.meta.env.PROD) {
  registerSW({ immediate: true, onRegisteredSW() { /* no-op */ } })
}
