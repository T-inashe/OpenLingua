import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev-only proxy to external quiz API to avoid CORS in the browser
      '/quiz-api': {
        target: 'https://language-quiz-api.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/quiz-api/, ''),
      },
    },
  },
})
