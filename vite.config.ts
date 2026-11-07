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
})
