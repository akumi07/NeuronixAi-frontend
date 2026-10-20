import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Production-only Content-Security-Policy via <meta>. (The dev server needs inline scripts/websockets for HMR.)
 * A meta CSP cannot set frame-ancestors; set real security headers at the web server too (see docs/SECURITY_HEADERS.md).
 */
function cspPlugin(apiOrigin: string): Plugin {
  return {
    name: 'neuronix-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'", // WebAssembly for on-device speech; the runtime is self-hosted
        "style-src 'self' 'unsafe-inline'", // components set inline style attributes
        "img-src 'self' data:",
        "font-src 'self'",
        // huggingface.co (+ its CDN hosts) is contacted only to download the optional on-device speech model weights
        `connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co${apiOrigin ? ` ${apiOrigin}` : ''}`,
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
    },
  }
}

// The backend sets no CORS headers, so in development `/api` and `/actuator` are proxied to it (same-origin for the browser).
// VITE_* values are non-secret and must never hold credentials.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_API_TARGET || 'http://localhost:8080'
  let apiOrigin = ''
  try { apiOrigin = env.VITE_API_BASE_URL ? new URL(env.VITE_API_BASE_URL).origin : '' } catch { /* invalid URL: ignore */ }
  return {
    plugins: [react(), tailwindcss(), cspPlugin(apiOrigin)],
    server: {
      proxy: {
        '/api': { target, changeOrigin: true },
        '/actuator': { target, changeOrigin: true },
      },
    },
    worker: { format: 'es' as const },
    test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
  }
})
