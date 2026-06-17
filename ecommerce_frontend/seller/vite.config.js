import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5176,
    strictPort: true,
    allowedHosts: [
      "aashansh.org",
      "seller.aashansh.org",
      "superadmin.aashansh.org",
      "localhost",
      "127.0.0.1",
    ],
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY_URL || 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_API_PROXY_URL || 'http://localhost:5000', changeOrigin: true },
    },
  },
})
