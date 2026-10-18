import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/basic': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})