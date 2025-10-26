import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
    },
    // By default, do NOT set a CSP in dev. Some tooling (React Refresh) injects
    // inline module scripts that require nonces/hashes, which is cumbersome in dev.
    // If you really want a dev CSP, set VITE_DEV_CSP=1 and we will apply a permissive header.
    headers: command === 'serve' && process.env.VITE_DEV_CSP === '1' ? {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
        "connect-src 'self' http://127.0.0.1:5002 http://localhost:5002 ws://127.0.0.1:8080 ws://localhost:8080",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "worker-src 'self' blob:"
      ].join('; ')
    } : undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', 'zod'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
}))
