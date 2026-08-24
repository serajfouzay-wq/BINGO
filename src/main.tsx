import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStoredTheme } from './lib/adminTheme'

// Apply the saved light/dark choice before first paint, so the admin does
// not flash the wrong theme on load.
applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
