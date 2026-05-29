import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    // encaminha /api pro servidor de dev (dev-server.js) durante o desenvolvimento
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
