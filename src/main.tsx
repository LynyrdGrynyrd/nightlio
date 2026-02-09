import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App'
import { applyTransparentFavicon } from './utils/iconUtils.js'

// Try to remove the background from the favicon at runtime (non-destructive)
// No-op if it fails; keeps original favicon
applyTransparentFavicon({ src: '/logo.png', threshold: 0 }).catch(() => {});

const enableDevServiceWorker =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_SW_DEV === 'true';

const cleanupStaleDevServiceWorker = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!import.meta.env.DEV || enableDevServiceWorker) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const candidates = [registration.active, registration.installing, registration.waiting];
          return candidates.some((worker) => worker?.scriptURL?.includes('/dev-sw.js?dev-sw'));
        })
        .map((registration) => registration.unregister())
    );
  } catch {
    // Ignore cleanup errors; this is a best-effort startup guard.
  }
};

void cleanupStaleDevServiceWorker();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
