// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { DYNAMIC_ICONS } from './app/constants/icons'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // App Capacitor = SPA, semua data di perangkat (IndexedDB via Dexie)
  ssr: false,

  modules: ['@nuxtjs/ionic', '@nuxt/icon', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: 'Fulus',
      htmlAttrs: { lang: 'id' },
      meta: [{ name: 'theme-color', content: '#1E5EFF' }],
    },
  },

  ionic: {
    // CSS Ionic di-import manual di main.css supaya bisa dimasukkan ke @layer
    // (agar utility Tailwind menang atas style bawaan Ionic)
    css: { core: false, basic: false, utilities: false },
    integrations: { icons: false },
    config: { mode: 'ios', swipeBackEnabled: true },
  },

  icon: {
    // 100% offline: jangan pernah fetch icon dari API Iconify
    provider: 'none',
    fallbackToApi: false,
    clientBundle: {
      scan: true,
      icons: DYNAMIC_ICONS,
      sizeLimitKb: 512,
    },
  },
})
