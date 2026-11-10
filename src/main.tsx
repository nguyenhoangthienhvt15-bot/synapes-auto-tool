import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAntiTamperGuard } from './utils/antiTamperGuard.ts'

// Kích hoạt khiên bảo mật chống F12 & DevTools theo Báo cáo Đánh giá Phiên họp 1
initAntiTamperGuard();

// Register high-speed service worker for 0ms cold-start resilience
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
