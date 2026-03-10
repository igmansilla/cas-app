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
  const isLocal = mode === 'development'
  const isDevRailway = env.RAILWAY_ENVIRONMENT_NAME === 'development' || env.RAILWAY_ENVIRONMENT_NAME === 'dev'
  
  let prefix = ''
  if (isDevRailway) prefix = '[DEV] '
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
          enabled: true,
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
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true, // Expone el servidor a la red local
      allowedHosts: true, // Permite acceso desde cualquier host (ngrok, cloudflare tunnel, etc.)
    },
  }
})
