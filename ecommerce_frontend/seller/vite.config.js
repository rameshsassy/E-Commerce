import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY_URL || 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_API_PROXY_URL || 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
})
