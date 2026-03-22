import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/serviceWorkerManager'
import { initIndexedDB } from '@/lib/indexedDBCache'

// Initialize service worker and offline storage
Promise.all([
  registerServiceWorker(),
  initIndexedDB()
]).catch(err => console.error('Failed to initialize offline features:', err))

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)