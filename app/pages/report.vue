<script setup lang="ts">
import type { Whisky, Store } from '~/composables/useBottleScan'

const { searchWhiskeys, searchStores, submitReport, fetchAllWhiskeys, fetchAllStores } = useBottleScan()
const user = useSupabaseUser()

const whiskyQuery = ref('')
const selectedWhisky = ref<string | null>(null)
const selectedWhiskyName = ref('')
const storeQuery = ref('')
const selectedStore = ref<string | null>(null)
const selectedStoreName = ref('')
const price = ref<number | null>(null)
const note = ref('')
const submitted = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const showWhiskyDropdown = ref(false)
const showStoreDropdown = ref(false)
const whiskyResults = ref<Whisky[]>([])
const storeResults = ref<Store[]>([])

// 초기 목록
onMounted(async () => {
  whiskyResults.value = await fetchAllWhiskeys()
  storeResults.value = await fetchAllStores()
})

let whiskyTimeout: ReturnType<typeof setTimeout>
async function onWhiskySearch() {
  selectedWhisky.value = null
  showWhiskyDropdown.value = true
  clearTimeout(whiskyTimeout)
  whiskyTimeout = setTimeout(async () => {
    whiskyResults.value = whiskyQuery.value
      ? await searchWhiskeys(whiskyQuery.value)
      : await fetchAllWhiskeys()
  }, 200)
}

let storeTimeout: ReturnType<typeof setTimeout>
async function onStoreSearch() {
  selectedStore.value = null
  showStoreDropdown.value = true
  clearTimeout(storeTimeout)
  storeTimeout = setTimeout(async () => {
    storeResults.value = storeQuery.value
      ? await searchStores(storeQuery.value)
      : await fetchAllStores()
  }, 200)
}

function selectWhisky(w: Whisky) {
  selectedWhisky.value = w.id
  selectedWhiskyName.value = w.name
  whiskyQuery.value = w.name
  showWhiskyDropdown.value = false
}

function selectStore(s: Store) {
  selectedStore.value = s.id
  selectedStoreName.value = s.name
  storeQuery.value = s.name
  showStoreDropdown.value = false
}

function formatPrice(val: number | null) {
  if (!val) return ''
  return val.toLocaleString('ko-KR')
}

async function handleSubmit() {
  if (!selectedWhisky.value || !selectedStore.value || !price.value) return
  if (!user.value) {
    errorMsg.value = 'Please sign in to submit a report.'
    return
  }

  submitting.value = true
  errorMsg.value = ''
  try {
    await submitReport({
      whiskey_id: selectedWhisky.value,
      store_id: selectedStore.value,
      price: price.value,
      note: note.value || undefined,
    })
    submitted.value = true
  } catch (e: any) {
    errorMsg.value = e.message || 'Failed to submit'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  whiskyQuery.value = ''
  selectedWhisky.value = null
  selectedWhiskyName.value = ''
  storeQuery.value = ''
  selectedStore.value = null
  selectedStoreName.value = ''
  price.value = null
  note.value = ''
  submitted.value = false
  errorMsg.value = ''
}
</script>

<template>
  <main class="max-w-xl mx-auto px-4 sm:px-6 py-8">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-bs-text-tertiary hover:text-bs-text-secondary text-sm mb-8 transition-colors">
      <LChevronLeft class="w-4 h-4" />
      Back
    </NuxtLink>

    <h1 class="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">가격 제보하기</h1>
    <p class="text-bs-text-tertiary mb-8">발견한 가격을 공유해서 커뮤니티를 도와주세요.</p>

    <!-- Not logged in -->
    <div v-if="!user" class="bg-bs-card border border-bs-border rounded-xl p-8 text-center">
      <LLock class="w-8 h-8 text-bs-text-tertiary mb-3" />
      <p class="text-white font-medium mb-2">로그인이 필요해요</p>
      <p class="text-bs-text-tertiary text-sm mb-6">가격 제보는 로그인 후 이용할 수 있어요.</p>
      <NuxtLink
        to="/login"
        class="inline-block bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
      >
        로그인
      </NuxtLink>
    </div>

    <!-- Success -->
    <div v-else-if="submitted" class="text-center py-20">
      <LCheckCircle class="w-14 h-14 text-bs-green mb-5" />
      <h2 class="font-serif text-2xl font-bold text-white mb-2">제보 완료!</h2>
      <p class="text-bs-text-secondary mb-8">커뮤니티에 기여해주셔서 감사해요 🥃</p>
      <div class="flex gap-3 justify-center">
        <button
          class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-6 py-3 rounded-xl transition-all"
          @click="resetForm"
        >
          추가 제보
        </button>
        <NuxtLink
          to="/"
          class="border border-bs-border-light text-bs-text-secondary hover:text-white hover:border-bs-gold/50 font-medium px-6 py-3 rounded-xl transition-all"
        >
          홈으로
        </NuxtLink>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Error -->
      <div v-if="errorMsg" class="bg-bs-red/10 border border-bs-red/30 rounded-xl p-4 text-bs-red text-sm">
        {{ errorMsg }}
      </div>

      <!-- Whisky -->
      <div class="relative">
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">위스키 *</label>
        <input
          v-model="whiskyQuery"
          type="text"
          placeholder="위스키 이름 검색..."
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all"
          @focus="showWhiskyDropdown = true"
          @input="onWhiskySearch"
        />
        <p v-if="selectedWhisky" class="text-bs-gold text-xs mt-1.5 flex items-center gap-1">
          <LCheck class="w-3.5 h-3.5" />
          {{ selectedWhiskyName }}
        </p>

        <div
          v-if="showWhiskyDropdown && whiskyResults.length > 0 && !selectedWhisky"
          class="absolute top-full left-0 right-0 mt-1 bg-bs-card border border-bs-border rounded-xl overflow-hidden z-10 max-h-52 overflow-y-auto shadow-2xl"
        >
          <button
            v-for="w in whiskyResults.slice(0, 8)"
            :key="w.id"
            type="button"
            class="w-full text-left px-4 py-3 hover:bg-bs-card-hover transition-colors border-b border-bs-border last:border-b-0"
            @click="selectWhisky(w)"
          >
            <p class="text-white text-sm font-medium">{{ w.name }}</p>
            <p class="text-bs-text-tertiary text-xs">{{ w.name_en }} · {{ w.category }}</p>
          </button>
        </div>
      </div>

      <!-- Price -->
      <div>
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">가격 (₩) *</label>
        <input
          v-model.number="price"
          type="number"
          placeholder="89000"
          min="0"
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all tabular-nums"
        />
        <p v-if="price" class="text-bs-text-tertiary text-xs mt-1.5">₩{{ formatPrice(price) }}</p>
      </div>

      <!-- Store -->
      <div class="relative">
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">매장 *</label>
        <input
          v-model="storeQuery"
          type="text"
          placeholder="매장 이름 검색..."
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all"
          @focus="showStoreDropdown = true"
          @input="onStoreSearch"
        />
        <p v-if="selectedStore" class="text-bs-gold text-xs mt-1.5 flex items-center gap-1">
          <LCheck class="w-3.5 h-3.5" />
          {{ selectedStoreName }}
        </p>

        <div
          v-if="showStoreDropdown && storeResults.length > 0 && !selectedStore"
          class="absolute top-full left-0 right-0 mt-1 bg-bs-card border border-bs-border rounded-xl overflow-hidden z-10 max-h-52 overflow-y-auto shadow-2xl"
        >
          <button
            v-for="s in storeResults.slice(0, 8)"
            :key="s.id"
            type="button"
            class="w-full text-left px-4 py-3 hover:bg-bs-card-hover transition-colors border-b border-bs-border last:border-b-0"
            @click="selectStore(s)"
          >
            <p class="text-white text-sm font-medium">{{ s.name }}</p>
            <p class="text-bs-text-tertiary text-xs">{{ s.region }} {{ s.sub_region }}</p>
          </button>
        </div>
      </div>

      <!-- Note -->
      <div>
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">메모 (선택)</label>
        <textarea
          v-model="note"
          placeholder="재고 한정, 세일 중 등 추가 정보..."
          rows="2"
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all resize-none"
        />
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!selectedWhisky || !selectedStore || !price || submitting"
        class="w-full bg-bs-gold hover:bg-bs-gold-light disabled:bg-bs-border disabled:text-bs-text-tertiary text-bs-black font-semibold py-3.5 rounded-xl transition-all"
      >
        {{ submitting ? '제보 중...' : '제보하기' }}
      </button>
    </form>
  </main>
</template>
