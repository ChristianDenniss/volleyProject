import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'production' && process.env.VITE_USE_MSW === 'true') {
    throw new Error('FATAL: VITE_USE_MSW must not be enabled in production builds.');
  }

  if (mode === 'production' && !process.env.VITE_BACKEND_URL) {
    throw new Error('FATAL: VITE_BACKEND_URL must be set for production builds.');
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      sourcemap: mode === 'production' ? 'hidden' : true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
