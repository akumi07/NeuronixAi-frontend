import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The backend sets no CORS headers, so in development `/api` is proxied to it (same-origin for the browser).
// VITE_DEV_API_TARGET is a non-secret local URL; it is only read here, never bundled.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:8080', changeOrigin: true } },
    },
  }
})
