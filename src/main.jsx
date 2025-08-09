import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register PWA update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      window.location.reload()
    }
  })
}

// Handle PWA installation prompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt = e
  
  // Show custom install button/banner
  const installBanner = document.createElement('div')
  installBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 1000;
      text-align: center;
      backdrop-filter: blur(10px);
    ">
      <div style="margin-bottom: 10px;">📱 Install KidBeat for the best experience!</div>
      <button id="install-btn" style="
        background: #6366f1;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        margin-right: 10px;
        cursor: pointer;
      ">Install App</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
      ">Maybe Later</button>
    </div>
  `
  
  document.body.appendChild(installBanner)
  
  document.getElementById('install-btn').addEventListener('click', async () => {
    // Show the prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    deferredPrompt = null
    installBanner.remove()
  })
  
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    installBanner.remove()
  })
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.body.contains(installBanner)) {
      installBanner.remove()
    }
  }, 10000)
})

// Handle successful PWA installation
window.addEventListener('appinstalled', (evt) => {
  console.log('KidBeat was installed successfully')
  // Track installation analytics if needed
})

// Prevent zoom on double tap for better UX
document.addEventListener('touchend', (event) => {
  if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
    event.preventDefault()
  }
}, { passive: false })

// Prevent pull-to-refresh on iOS
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault()
  }
}, { passive: false })

let lastTouchEnd = 0
document.addEventListener('touchend', (event) => {
  const now = (new Date()).getTime()
  if (now - lastTouchEnd <= 300) {
    event.preventDefault()
  }
  lastTouchEnd = now
}, false)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)