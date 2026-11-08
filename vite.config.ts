import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error shared ESM backend engine
import { handleStudioApiRequest } from './server/studioBackendEngine.mjs'

function studioDevBackendPlugin() {
  return {
    name: 'synapes-studio-dev-backend',
    configureServer(server: any) {
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
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }
        },
      },
    },
  },
})
