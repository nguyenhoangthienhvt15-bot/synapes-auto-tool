import https from 'https'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function ttsDevMiddlewarePlugin() {
  return {
    name: 'synapes-tts-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/tts', (req: any, res: any) => {
        try {
          const parsedUrl = new URL(req.url || '', 'http://localhost')
          const text = (parsedUrl.searchParams.get('text') || 'Xin chào').trim().slice(0, 195)
          const lang = parsedUrl.searchParams.get('lang') || 'vi'
          const tl = lang.startsWith('en') ? 'en' : 'vi'
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(text)}`

          https
            .get(
              url,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                },
              },
              (resp) => {
                if (resp.statusCode !== 200) {
                  res.writeHead(502)
                  res.end('TTS upstream error')
                  return
                }
                res.writeHead(200, {
                  'Content-Type': 'audio/mpeg',
                  'Access-Control-Allow-Origin': '*',
                  'X-TTS-Engine': 'google-neural-dsp',
                })
                resp.pipe(res)
              }
            )
            .on('error', () => {
              res.writeHead(502)
              res.end('TTS network error')
            })
        } catch {
          res.writeHead(500)
          res.end('TTS internal error')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ttsDevMiddlewarePlugin(),
  ],
})
