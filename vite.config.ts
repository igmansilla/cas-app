import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { oidcSpa } from 'oidc-spa/vite-plugin'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appEnv = (env.VITE_APP_ENV || env.VITE_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_NAME || '').trim().toLowerCase()
  const isLocal = appEnv === 'local' || mode === 'development'
  const isDev = appEnv === 'development' || appEnv === 'dev'
  const enablePwaInDev = env.VITE_PWA_DEV === 'true'
  const localApiProxyTarget = (env.VITE_LOCAL_API_PROXY_TARGET || 'http://localhost:8082').trim()
  
  let prefix = ''
  if (isDev) prefix = '[DEV] '
  else if (isLocal) prefix = '[LOCAL] '

  const appName = prefix ? `${prefix}Campamento Andino Sayhueque` : 'Campamento Andino Sayhueque'
  const shortName = prefix ? `${prefix}CAS` : 'CAS'
  const appTitle = prefix ? `${prefix}CAS` : 'CAS'

  return {
    plugins: [
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /<title>(.*?)<\/title>/,
            `<title>${appTitle}</title>`
          )
        }
      },
      devtools(),
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      oidcSpa({
        enableTokenExfiltrationDefense: false
      }),
      viteReact(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'firebase-messaging-sw.ts',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: enablePwaInDev,
          type: 'module',
        },
        manifest: {
          name: appName,
          short_name: shortName,
          description: 'Campamento Andino Sayhueque App',
          theme_color: '#ea580c',
          background_color: '#ffffff',
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    optimizeDeps: {
      include: [
        'date-fns',
        'date-fns/addDays',
        'date-fns/format',
        'date-fns/locale/es',
        '@tanstack/react-form',
        '@stepperize/react',
      ],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true, // Expone el servidor a la red local
      allowedHosts: true, // Permite acceso desde cualquier host (ngrok, cloudflare tunnel, etc.)
      // Cuando Cloudflare expone local-app -> localhost:5173, reenviar
      // endpoints de Keycloak al servicio local en 8181.
      proxy: {
        '/api': {
          // En localhost evitamos depender del tunnel para la API.
          target: localApiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/realms': {
          target: 'http://localhost:8181',
          changeOrigin: true,
          secure: false,
        },
        '/resources': {
          target: 'http://localhost:8181',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'http://localhost:8181',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/auth/, ''),
        },
      },
    },
  }
})
