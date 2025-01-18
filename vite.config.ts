import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
      interval: 50,
    },
    proxy: {
      '/api/v1': {
        target: process.env.VITE_SECONDLANE_API_URL || 'https://nonprod.secondlane.io',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', () => {
            // console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            // Copy all headers from original request
            Object.keys(req.headers).forEach(key => {
              if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'origin') {
                const value = req.headers[key];
                if (value !== undefined) {
                  proxyReq.setHeader(key, value);
                }
              }
            });

            // console.log('Proxying request:', {
            //   method: req.method,
            //   url: req.url,
            //   headers: proxyReq.getHeaders()
            // });
          });
          proxy.on('proxyRes', (proxyRes) => { //, req) => {
            // Add CORS headers to response
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

            const statusCode = proxyRes.statusCode || 500;
            if (statusCode >= 400) {
              // console.error('Proxy error response:', {
              //   statusCode,
              //   url: req.url,
              //   headers: proxyRes.headers
              // });
            } else {
              // console.log('Proxy success response:', {
              //   statusCode,
              //   url: req.url,
              //   headers: proxyRes.headers
              // });
            }
          });
        },
      }
    }
  },
  base: './',
  css: {
    devSourcemap: true,
  }
})
