import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '0.0.0.0',
      port: 5173,
      overlay: true,
      clientPort: 5173,
      protocol: 'ws',
      timeout: 1000,
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    watch: {
      usePolling: true,
      interval: 100, // Increase interval to reduce CPU load
    },
    proxy: {
      '/api': {
        target: 'https://nonprod.secondlane.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  base: './',
  css: {
    devSourcemap: true,
  },
  // Optimizations for fast updates
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  },
  // Add settings to improve updates
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
