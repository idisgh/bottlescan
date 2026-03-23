// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts', '@nuxtjs/supabase'],
  runtimeConfig: {
    naverClientId: process.env.NAVER_CLIENT_ID,
    naverClientSecret: process.env.NAVER_CLIENT_SECRET,
    naverRedirectUri: process.env.NAVER_REDIRECT_URI,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      kakaoJsKey: process.env.KAKAO_JS_KEY,
    },
  },
  supabase: {
    redirect: false,
  },
  devServer: { port: 3020 },
  app: {
    head: {
      title: 'BottleScan — 위스키 가격 트래커',
      meta: [
        { name: 'description', content: '위스키 가격을 제보하고, 최저가 매장을 찾아보세요.' },
        { name: 'theme-color', content: '#0D0D0D' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      script: [
        { src: 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js', defer: true },
      ],
    },
  },
  googleFonts: {
    families: {
      'Playfair Display': { wght: [400, 500, 600, 700], ital: [400, 700] },
      'Libre Baskerville': { wght: [400, 700], ital: [400] },
      'Great Vibes': [400],
      'Inter': [300, 400, 500, 600, 700],
    },
    display: 'swap',
  },
  tailwindcss: {
    config: {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            serif: ['Playfair Display', 'Georgia', 'serif'],
            logo: ['Great Vibes', 'cursive'],
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          },
          colors: {
            bs: {
              black: '#0D0D0D',
              bg: '#141414',
              card: '#1A1A1A',
              'card-hover': '#222222',
              border: '#2A2A2A',
              'border-light': '#3A3A3A',
              gold: '#D4A030',
              'gold-light': '#E8B531',
              'gold-dim': '#A07820',
              amber: '#C88A2A',
              green: '#66BB6A',
              red: '#E53935',
              'text-primary': '#FFFFFF',
              'text-secondary': '#A0A0A0',
              'text-tertiary': '#666666',
            },
          },
        },
      },
    },
  },
})
