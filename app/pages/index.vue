<script setup lang="ts">
import type { Whisky } from '~/composables/useBottleScan'

const { fetchReports, searchWhiskeys, fetchPopularWhiskeys } = useBottleScan()

const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref<Whisky[]>([])

const { data: reports } = await useAsyncData('reports', () => fetchReports(20))
const { data: popular } = await useAsyncData('popular', () => fetchPopularWhiskeys(8))

// 첫 번째 제보를 Hero로
const featuredReport = computed(() => reports.value?.[0])

let searchTimeout: ReturnType<typeof setTimeout>
async function onSearch(query: string) {
  searchQuery.value = query
  if (!query || query.length < 1) {
    showSearchResults.value = false
    searchResults.value = []
    return
  }
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searchResults.value = await searchWhiskeys(query)
    showSearchResults.value = true
  }, 200)
}

function formatPrice(price: number | null | undefined) {
  if (!price) return '-'
  return '₩' + price.toLocaleString('ko-KR')
}

function getLowestPrice(whiskyId: string) {
  const whiskyReports = reports.value?.filter(r => r.whiskey_id === whiskyId) || []
  if (!whiskyReports.length) return null
  return Math.min(...whiskyReports.map(r => r.price))
}
</script>

<template>
  <main class="max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Hero -->
    <section v-if="featuredReport" class="py-12 sm:py-16">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div class="flex-1">
          <span class="text-xs font-semibold tracking-widest text-bs-gold uppercase">Editor's Pick</span>
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 leading-tight">
            {{ featuredReport.whiskeys?.name }}
          </h1>
          <p class="text-bs-text-secondary mt-3 max-w-lg leading-relaxed">
            {{ featuredReport.whiskeys?.name_en }} · {{ featuredReport.whiskeys?.category }} · {{ featuredReport.whiskeys?.abv }}% · {{ featuredReport.whiskeys?.volume_ml }}ml
          </p>
          <div class="flex items-center gap-4 mt-6">
            <span class="text-3xl font-bold text-white tabular-nums">{{ formatPrice(featuredReport.price) }}</span>
            <span class="text-bs-green text-sm font-medium bg-bs-green/10 px-2 py-0.5 rounded">Latest</span>
          </div>
          <div class="flex items-center gap-3 mt-6">
            <NuxtLink
              :to="`/whisky/${featuredReport.whiskey_id}`"
              class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
            >
              Track It
            </NuxtLink>
            <NuxtLink
              :to="`/whisky/${featuredReport.whiskey_id}`"
              class="border border-bs-border-light text-bs-text-secondary hover:text-white hover:border-bs-gold/50 font-medium px-6 py-2.5 rounded-lg transition-all text-sm"
            >
              View Details
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 제보 없을 때 -->
    <section v-else class="py-12 sm:py-16 text-center">
      <LWine class="w-12 h-12 text-bs-gold mb-4" />
      <h1 class="font-serif text-3xl font-bold text-white mb-3">Welcome to BottleScan</h1>
      <p class="text-bs-text-secondary mb-6">Be the first to report a whisky price!</p>
      <NuxtLink
        to="/report"
        class="inline-block bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
      >
        + Report Price
      </NuxtLink>
    </section>

    <!-- Search -->
    <section class="mb-10 relative">
      <SearchBar v-model="searchQuery" @search="onSearch" />

      <div
        v-if="showSearchResults && searchResults.length > 0"
        class="absolute top-full left-0 right-0 mt-2 bg-bs-card border border-bs-border rounded-xl overflow-hidden z-20 shadow-2xl"
      >
        <NuxtLink
          v-for="w in searchResults"
          :key="w.id"
          :to="`/whisky/${w.id}`"
          class="flex items-center justify-between px-5 py-3.5 hover:bg-bs-card-hover transition-colors border-b border-bs-border last:border-b-0"
          @click="showSearchResults = false"
        >
          <div>
            <p class="text-white font-medium">{{ w.name }}</p>
            <p class="text-bs-text-tertiary text-sm">{{ w.name_en }} · {{ w.category }}</p>
          </div>
        </NuxtLink>
      </div>
      <div
        v-else-if="showSearchResults && searchQuery.length > 0 && searchResults.length === 0"
        class="absolute top-full left-0 right-0 mt-2 bg-bs-card border border-bs-border rounded-xl p-5 text-center text-bs-text-tertiary z-20"
      >
        No results found
      </div>
    </section>

    <!-- Most Reported (제보 있을 때만) -->
    <section v-if="popular?.length" class="mb-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-serif text-xl sm:text-2xl font-bold text-white">Most Reported This Week</h2>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NuxtLink
          v-for="(item, idx) in popular"
          :key="item.whisky?.id"
          :to="`/whisky/${item.whisky?.id}`"
          class="group bg-bs-card border border-bs-border rounded-xl p-4 hover:border-bs-gold/30 hover:bg-bs-card-hover transition-all duration-300"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="text-bs-gold font-serif font-bold text-sm">#{{ idx + 1 }}</span>
            <span class="text-[10px] uppercase tracking-wider text-bs-text-tertiary bg-bs-bg px-1.5 py-0.5 rounded">
              {{ item.whisky?.category }}
            </span>
          </div>
          <p class="text-white text-sm font-medium leading-snug group-hover:text-bs-gold transition-colors line-clamp-2">
            {{ item.whisky?.name }}
          </p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-bs-text-tertiary text-xs">{{ item.count }} reports</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Recent Reports -->
    <section v-if="reports?.length" class="mb-12">
      <h2 class="font-serif text-xl sm:text-2xl font-bold text-white mb-6">Recent Price Reports</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReportCard v-for="report in reports" :key="report.id" :report="report" />
      </div>
    </section>
  </main>
</template>
