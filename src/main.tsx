import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { applyTransparentFavicon } from './utils/iconUtils.js'

// Try to remove the background from the favicon at runtime (non-destructive)
// No-op if it fails; keeps original favicon
applyTransparentFavicon({ src: '/logo.png', threshold: 0 }).catch(() => {});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
