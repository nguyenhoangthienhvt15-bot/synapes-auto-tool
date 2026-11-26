import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function studioDevBackendPlugin() {
  return {
    name: 'synapes-studio-dev-backend',
    async configureServer(server: any) {
      // Load local .env and backend engine only in Vite dev mode (never during production build)
      // @ts-expect-error shared ESM env loader without declaration file
      await import('./server/loadEnv.mjs')
      // @ts-expect-error shared ESM backend engine
      const { handleStudioApiRequest } = await import('./server/studioBackendEngine.mjs')
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const handled = await handleStudioApiRequest(req, res)
          if (handled) return
        } catch (err) {
          console.error('[Studio Dev Middleware Error]:', err)
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    studioDevBackendPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/mediabunny')) {
            return 'vendor-media';
          }
          if (
            id.includes('node_modules/lottie-web') ||
            id.includes('node_modules/gsap') ||
            id.includes('node_modules/roughjs') ||
            id.includes('node_modules/gl-transitions') ||
            id.includes('node_modules/wawa-lipsync')
          ) {
            return 'vendor-motion';
          }
          if (
            id.includes('node_modules/html2pdf') ||
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/html2canvas')
          ) {
            return 'vendor-pdf';
          }
          if (
            id.includes('src/data/appsScriptCode') ||
            id.includes('src/data/stampBase64') ||
            id.includes('src/data/qrCodeBase64')
          ) {
            return 'contract-assets';
          }
        },
      },
    },
  },
})
