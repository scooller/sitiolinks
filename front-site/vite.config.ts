import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// URL del backend Laravel - leída desde variables de entorno en tiempo de build/dev

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
  const FRONTEND_URL = env.VITE_FRONTEND_URL || 'http://127.0.0.1:3000'
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'robots.txt'],
      manifest: {
        short_name: 'OnlyModels',
        name: 'Only Models - Plataforma de Creadores',
        description: 'Plataforma para perfiles, galerías y descubrimiento de creadores',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'logo190.png',
            type: 'image/png',
            sizes: '190x190',
            purpose: 'any maskable'
          },
          {
            src: 'logo500.png',
            type: 'image/png',
            sizes: '500x500',
            purpose: 'any maskable'
          }
        ],
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0d6efd',
        background_color: '#ffffff',
        categories: ['social', 'entertainment']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*\.(woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'webfonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/storage\/.*\.(jpg|jpeg|png|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/graphql.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'graphql-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 3 // 3 minutos
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'analytics-cache',
              networkTimeoutSeconds: 3
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: null, // Deshabilitar para evitar problemas con SPA
      },
      devOptions: {
        enabled: false // Deshabilitar en dev para evitar conflictos con proxy
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap': ['react-bootstrap'],
          'motion': ['motion'],
          'lightgallery': ['lightgallery'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
  },
  // base resuelve a '/'; producción bajo https://only-models.online en raíz
  server: {
    host: '127.0.0.1',
    port: 3000,
    open: false,
    proxy: {
      // Proxy GraphQL to Laravel
      '/graphql': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Preserve cookies
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            // Set correct referer
            proxyReq.setHeader('referer', BACKEND_URL);
            proxyReq.setHeader('origin', FRONTEND_URL);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Preserve Set-Cookie headers from Laravel and normalize domain for Vite dev origin
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              const normalize = (cookie: string): string => cookie
                // Force cookie domain to 127.0.0.1 for Vite dev
                .replace(/Domain=[^;]+/gi, 'Domain=127.0.0.1')
                // Drop Secure in dev over http
                .replace(/;\s*Secure/gi, '');
              const modified = Array.isArray(setCookie) ? setCookie.map(normalize) : [normalize(setCookie)];
              proxyRes.headers['set-cookie'] = modified;
            }
          });
        },
      },
      '/storage': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/gallery-media': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/api': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Preserve cookies
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            // Set correct referer
            proxyReq.setHeader('referer', BACKEND_URL);
            proxyReq.setHeader('origin', FRONTEND_URL);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Preserve Set-Cookie headers from Laravel
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              // Normalize cookie domain and flags to work with 127.0.0.1:3000
              const normalize = (cookie: string): string => cookie
                .replace(/Domain=[^;]+/gi, 'Domain=127.0.0.1')
                .replace(/;\s*Secure/gi, '');
              const modified = Array.isArray(setCookie) ? setCookie.map(normalize) : [normalize(setCookie)];
              proxyRes.headers['set-cookie'] = modified;
            }
          });
        },
      },
      '/sanctum': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Preserve cookies
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
            proxyReq.setHeader('referer', BACKEND_URL);
            proxyReq.setHeader('origin', FRONTEND_URL);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Preserve Set-Cookie headers
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              const normalize = (cookie: string): string => cookie
                .replace(/Domain=[^;]+/gi, 'Domain=127.0.0.1')
                .replace(/;\s*Secure/gi, '');
              const modified = Array.isArray(setCookie) ? setCookie.map(normalize) : [normalize(setCookie)];
              proxyRes.headers['set-cookie'] = modified;
            }
          });
        },
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy: {
      '/graphql': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/storage': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/gallery-media': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/api': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
      '/sanctum': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false,
      },
    },
  },
}
})
