<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const { fetchWhisky, fetchReportsByWhisky } = useBottleScan()

const whiskyId = route.params.id as string

const { data: whisky } = await useAsyncData(`whisky-${whiskyId}`, () => fetchWhisky(whiskyId))
const { data: reports } = await useAsyncData(`reports-${whiskyId}`, () => fetchReportsByWhisky(whiskyId))

const lowestPrice = computed(() => {
  if (!reports.value?.length) return null
  return Math.min(...reports.value.map(r => r.price))
})

const avgPrice = computed(() => {
  if (!reports.value?.length) return null
  const sum = reports.value.reduce((acc, r) => acc + r.price, 0)
  return Math.round(sum / reports.value.length)
})

const highestPrice = computed(() => {
  if (!reports.value?.length) return null
  return Math.max(...reports.value.map(r => r.price))
})

function formatPrice(price: number | null) {
  if (!price) return '-'
  return '₩' + price.toLocaleString('ko-KR')
}

function shareKakao() {
  const kakao = (window as any).Kakao
  if (!kakao) return

  if (!kakao.isInitialized()) {
    kakao.init(config.public.kakaoJsKey)
  }

  const url = window.location.href
  const title = whisky.value?.name || 'BottleScan'
  const desc = lowestPrice.value
    ? `최저가 ${formatPrice(lowestPrice.value)} · ${reports.value?.length || 0}개 제보`
    : '위스키 가격을 제보해보세요!'

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description: desc,
      imageUrl: 'https://bottlescan.vercel.app/og-image.png',
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [
      { title: '가격 확인하기', link: { mobileWebUrl: url, webUrl: url } },
      { title: '제보하기', link: { mobileWebUrl: 'https://bottlescan.vercel.app/report', webUrl: 'https://bottlescan.vercel.app/report' } },
    ],
  })
}

// ── 입고 알림 ──────────────────────────────────────────
const isAlertSubscribed = ref(false)
const isAlertLoading = ref(false)
const pushPermission = ref<NotificationPermission>('default')

onMounted(async () => {
  if (typeof Notification !== 'undefined') {
    pushPermission.value = Notification.permission
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { subscribed } = await $fetch<{ subscribed: boolean }>(
    `/api/alerts/status?userId=${user.id}&whiskyId=${whiskyId}`
  )
  isAlertSubscribed.value = subscribed
})

async function toggleAlert() {
  isAlertLoading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigateTo('/login'); return }

    // 푸시 권한 요청
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      pushPermission.value = perm
      if (perm !== 'granted') return
    }

    // Service Worker 구독 등록
    const reg = await navigator.serviceWorker.ready
    let pushSub = await reg.pushManager.getSubscription()
    if (!pushSub) {
      pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
      })
    }
    const subJson = pushSub.toJSON()
    await $fetch('/api/push/subscribe', {
      method: 'POST',
      body: {
        userId: user.id,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      },
    })

    // 알림 토글
    const { subscribed } = await $fetch<{ subscribed: boolean }>('/api/alerts', {
      method: 'POST',
      body: { userId: user.id, whiskyId },
    })
    isAlertSubscribed.value = subscribed
  } finally {
    isAlertLoading.value = false
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
// ────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-bs-text-tertiary hover:text-bs-text-secondary text-sm mb-8 transition-colors">
      <LChevronLeft class="w-4 h-4" />
      Back to Dashboard
    </NuxtLink>

    <template v-if="whisky">
      <div class="mb-8">
        <span class="text-xs font-semibold tracking-widest text-bs-gold uppercase">{{ whisky.category }}</span>
        <h1 class="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">{{ whisky.name }}</h1>
        <p class="text-bs-text-secondary text-lg mt-1">{{ whisky.name_en }}</p>
        <div class="flex items-center gap-4 mt-4 text-sm text-bs-text-tertiary">
          <span>{{ whisky.abv }}% ABV</span>
          <span class="text-bs-border-light">·</span>
          <span>{{ whisky.volume_ml }}ml</span>
          <span class="text-bs-border-light">·</span>
          <span>{{ reports?.length || 0 }} price reports</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-8">
        <div class="bg-bs-card border border-bs-border rounded-xl p-5">
          <p class="text-bs-text-tertiary text-xs uppercase tracking-wider mb-2">Lowest</p>
          <p class="text-bs-gold text-2xl font-bold tabular-nums">{{ formatPrice(lowestPrice) }}</p>
        </div>
        <div class="bg-bs-card border border-bs-border rounded-xl p-5">
          <p class="text-bs-text-tertiary text-xs uppercase tracking-wider mb-2">Average</p>
          <p class="text-white text-2xl font-bold tabular-nums">{{ formatPrice(avgPrice) }}</p>
        </div>
        <div class="bg-bs-card border border-bs-border rounded-xl p-5">
          <p class="text-bs-text-tertiary text-xs uppercase tracking-wider mb-2">Highest</p>
          <p class="text-bs-text-secondary text-2xl font-bold tabular-nums">{{ formatPrice(highestPrice) }}</p>
        </div>
      </div>

      <div class="flex gap-3 mb-10">
        <NuxtLink
          to="/report"
          class="flex-1 bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold py-3.5 rounded-xl text-center transition-all"
        >
          가격 제보하기
        </NuxtLink>
        <!-- 입고 알림 버튼 -->
        <button
          class="flex items-center gap-2 px-4 border rounded-xl font-semibold py-3.5 transition-all"
          :class="isAlertSubscribed
            ? 'bg-bs-gold/10 border-bs-gold/50 text-bs-gold'
            : 'bg-bs-card border-bs-border text-bs-text-secondary hover:border-bs-gold/30 hover:text-bs-text-primary'"
          :disabled="isAlertLoading"
          @click="toggleAlert"
        >
          <span v-if="isAlertLoading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span v-else>{{ isAlertSubscribed ? '🔔' : '🔕' }}</span>
          <span class="text-sm">{{ isAlertSubscribed ? '알림 ON' : '알림' }}</span>
        </button>
        <button
          class="flex items-center gap-2 px-4 bg-[#FEE500] hover:bg-[#fdd900] text-[#191919] font-semibold py-3.5 rounded-xl transition-all"
          @click="shareKakao"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.97l-.95 3.47c-.08.29.23.52.48.36L10.1 19.7c.62.09 1.26.14 1.9.14 5.52 0 10-3.69 10-8.25S17.52 3 12 3z"/>
          </svg>
          공유
        </button>
      </div>

      <section v-if="reports?.length">
        <h2 class="font-serif text-xl font-bold text-white mb-5">Price by Store</h2>
        <div class="space-y-3">
          <div
            v-for="(report, idx) in reports"
            :key="report.id"
            class="bg-bs-card border border-bs-border rounded-xl p-5 flex items-start justify-between"
            :class="{ 'border-bs-gold/30': idx === 0 }"
          >
            <div>
              <div class="flex items-center gap-2">
                <p class="text-white font-medium">{{ report.stores?.name }}</p>
                <span
                  v-if="idx === 0"
                  class="text-[10px] uppercase tracking-wider text-bs-gold bg-bs-gold/10 px-1.5 py-0.5 rounded"
                >
                  Best Price
                </span>
              </div>
              <p class="text-bs-text-tertiary text-sm mt-0.5">{{ report.stores?.region }} {{ report.stores?.sub_region }}</p>
              <div class="flex items-center gap-3 mt-2">
                <div class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-bs-border-light flex items-center justify-center text-[10px] text-bs-text-secondary">
                    {{ report.profiles?.nickname?.charAt(0) || 'U' }}
                  </div>
                  <span class="text-xs text-bs-text-tertiary">{{ report.profiles?.nickname || 'User' }}</span>
                </div>
                <span class="text-xs text-bs-text-tertiary">{{ timeAgo(report.created_at) }}</span>
              </div>
              <p
                v-if="report.note"
                class="mt-2 text-sm text-bs-text-secondary italic"
              >
                "{{ report.note }}"
              </p>
            </div>
            <span class="text-bs-gold font-bold text-xl tabular-nums">{{ formatPrice(report.price) }}</span>
          </div>
        </div>
      </section>
      <div v-else class="text-center text-bs-text-tertiary py-12">
        <LInbox class="w-8 h-8 text-bs-text-tertiary mb-2 mx-auto" />
        <p>No price reports yet. Be the first!</p>
      </div>
    </template>

    <div v-else class="text-center text-bs-text-tertiary py-24">
      <LSearch class="w-10 h-10 text-bs-text-tertiary mb-4 mx-auto" />
      <p class="font-serif text-xl">Whisky not found</p>
    </div>
  </main>
</template>
