import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAntiTamperGuard } from './utils/antiTamperGuard.ts'

// Kích hoạt khiên bảo mật chống F12 & DevTools theo Báo cáo Đánh giá Phiên họp 1
initAntiTamperGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
