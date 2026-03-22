<script setup lang="ts">
const route = useRoute()
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

      <NuxtLink
        to="/report"
        class="block w-full bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold py-3.5 rounded-xl text-center transition-all mb-10"
      >
        Report a Price for This Whisky
      </NuxtLink>

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
