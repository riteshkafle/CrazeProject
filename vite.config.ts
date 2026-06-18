import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, '/v1'),
      },
      '/api/hunter-domain': {
        target: 'https://api.hunter.io',
        changeOrigin: true,
        rewrite: () => '/v2/domain-search',
      },
      '/api/hunter-email': {
        target: 'https://api.hunter.io',
        changeOrigin: true,
        rewrite: () => '/v2/email-finder',
      },
      '/api/news': {
        target: 'https://newsapi.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, ''),
      },
    },
  },
})
