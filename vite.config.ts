import http from 'http'
import https from 'https'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEV_IMAGE_CACHE = new Map<string, { buffer: Buffer; contentType: string }>()

function fetchDevBuffer(targetUrl: string, redirectsLeft = 4): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    if (redirectsLeft <= 0) return reject(new Error('Too many redirects'))
    const client = targetUrl.startsWith('https') ? https : http
    const req = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      (resp) => {
        if (resp.statusCode && resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
          const nextUrl = new URL(resp.headers.location, targetUrl).toString()
          resp.resume()
          fetchDevBuffer(nextUrl, redirectsLeft - 1).then(resolve).catch(reject)
          return
        }
        if (resp.statusCode !== 200) {
          resp.resume()
          return reject(new Error(`Status ${resp.statusCode}`))
        }
        const contentType = String(resp.headers['content-type'] || 'image/jpeg')
        const chunks: Buffer[] = []
        resp.on('data', (c) => chunks.push(c))
        resp.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }))
      }
    )
    req.on('error', reject)
  })
}

function ttsDevMiddlewarePlugin() {
  return {
    name: 'synapes-tts-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/image-proxy', async (req: any, res: any) => {
        try {
          const parsedUrl = new URL(req.url || '', 'http://localhost')
          const targetUrl =
            parsedUrl.searchParams.get('url') ||
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1400&q=85'
          if (DEV_IMAGE_CACHE.has(targetUrl)) {
            const cached = DEV_IMAGE_CACHE.get(targetUrl)!
            res.writeHead(200, {
              'Content-Type': cached.contentType,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400',
            })
            res.end(cached.buffer)
            return
          }
          const fetched = await fetchDevBuffer(targetUrl)
          DEV_IMAGE_CACHE.set(targetUrl, fetched)
          res.writeHead(200, {
            'Content-Type': fetched.contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          })
          res.end(fetched.buffer)
        } catch {
          res.writeHead(502)
          res.end('Image proxy error')
        }
      })

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
