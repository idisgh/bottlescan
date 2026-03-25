<script setup lang="ts">
useHead({ title: 'BottleScan — 내 프로필' })

const client = useSupabaseClient()
const { fetchReportsByWhisky } = useBottleScan()

const profile = ref<any>(null)
const myReports = ref<any[]>([])
const myReviews = ref<any[]>([])
const isLoading = ref(true)
const isEditing = ref(false)
const nickname = ref('')
const isChecking = ref(false)
const isAvailable = ref<boolean | null>(null)
const isSaving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

let checkTimeout: ReturnType<typeof setTimeout>

async function load() {
  isLoading.value = true
  const { data: { user } } = await client.auth.getUser()
  if (!user) { navigateTo('/login'); return }

  const { data: p } = await client.from('profiles').select('*').eq('id', user.id).single()
  profile.value = p
  nickname.value = p?.nickname || ''

  // 내 제보
  const { data: reports } = await client
    .from('reports')
    .select('*, whiskeys(*), stores(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  myReports.value = reports || []

  // 내 리뷰
  const { data: reviews } = await client
    .from('reviews')
    .select('*, whiskeys(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  myReviews.value = reviews || []

  isLoading.value = false
}

function onNicknameInput() {
  isAvailable.value = null
  errorMsg.value = ''
  clearTimeout(checkTimeout)
  checkTimeout = setTimeout(checkNickname, 400)
}

async function checkNickname() {
  const val = nickname.value.trim()
  if (!val || val.length < 2 || val === profile.value?.nickname) {
    isAvailable.value = null
    return
  }
  isChecking.value = true
  const { data } = await client.from('profiles').select('id').eq('nickname', val).single()
  isAvailable.value = !data
  isChecking.value = false
}

async function saveNickname() {
  const val = nickname.value.trim()
  if (!val || val.length < 2) { errorMsg.value = '2자 이상 입력해주세요'; return }
  if (isAvailable.value === false) { errorMsg.value = '이미 사용 중인 닉네임이에요'; return }

  isSaving.value = true
  const { data: { user } } = await client.auth.getUser()
  const { error } = await client.from('profiles').update({ nickname: val }).eq('id', user!.id)
  if (error) { errorMsg.value = '저장 실패'; isSaving.value = false; return }

  profile.value.nickname = val
  isEditing.value = false
  isAvailable.value = null
  successMsg.value = '닉네임이 변경됐어요!'
  setTimeout(() => successMsg.value = '', 3000)
  isSaving.value = false
}

function formatPrice(p: number) { return '₩' + p.toLocaleString('ko-KR') }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  return `${days}일 전`
}

onMounted(load)
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-serif text-3xl font-bold text-white mb-8">내 프로필</h1>

    <div v-if="isLoading" class="text-center py-16">
      <div class="w-6 h-6 border-2 border-bs-gold border-t-transparent rounded-full animate-spin mx-auto" />
    </div>

    <template v-else>
      <!-- 프로필 카드 -->
      <div class="bg-bs-card border border-bs-border rounded-2xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-5">
          <div class="w-14 h-14 rounded-full bg-bs-gold/20 flex items-center justify-center text-2xl font-bold text-bs-gold">
            {{ profile?.nickname?.charAt(0) || 'U' }}
          </div>
          <div>
            <p class="text-white font-semibold text-lg">{{ profile?.nickname || 'User' }}</p>
            <p class="text-bs-text-tertiary text-sm">제보 {{ myReports.length }}건 · 리뷰 {{ myReviews.length }}건</p>
          </div>
        </div>

        <!-- 닉네임 수정 -->
        <div v-if="isEditing" class="space-y-3">
          <div class="relative">
            <input
              v-model="nickname"
              type="text"
              maxlength="12"
              placeholder="새 닉네임 (2~12자)"
              class="w-full bg-bs-bg border rounded-xl px-4 py-3 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none pr-10 transition-colors"
              :class="isAvailable === true ? 'border-green-500/50' : isAvailable === false ? 'border-red-500/50' : 'border-bs-border focus:border-bs-gold/50'"
              @input="onNicknameInput"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
              <span v-if="isChecking" class="w-4 h-4 border-2 border-bs-gold border-t-transparent rounded-full animate-spin block" />
              <span v-else-if="isAvailable === true" class="text-green-400">✓</span>
              <span v-else-if="isAvailable === false" class="text-red-400">✗</span>
            </span>
          </div>
          <p v-if="isAvailable === true" class="text-xs text-green-400">사용 가능한 닉네임이에요</p>
          <p v-else-if="isAvailable === false" class="text-xs text-red-400">이미 사용 중이에요</p>
          <p v-if="errorMsg" class="text-xs text-red-400">{{ errorMsg }}</p>
          <div class="flex gap-2">
            <button
              class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold text-sm px-5 py-2 rounded-lg transition-all disabled:opacity-50"
              :disabled="isSaving || isAvailable === false || nickname.trim().length < 2"
              @click="saveNickname"
            >저장</button>
            <button
              class="text-bs-text-tertiary hover:text-bs-text-secondary text-sm px-4 py-2 transition-colors"
              @click="isEditing = false; nickname = profile?.nickname || ''"
            >취소</button>
          </div>
        </div>
        <div v-else class="flex items-center gap-3">
          <p v-if="successMsg" class="text-green-400 text-sm">{{ successMsg }}</p>
          <button
            class="text-sm text-bs-text-tertiary hover:text-bs-gold border border-bs-border hover:border-bs-gold/30 px-4 py-2 rounded-lg transition-all"
            @click="isEditing = true"
          >닉네임 수정</button>
        </div>
      </div>

      <!-- 내 제보 -->
      <section class="mb-6">
        <h2 class="font-serif text-lg font-bold text-white mb-4">내 제보 ({{ myReports.length }})</h2>
        <div v-if="myReports.length" class="space-y-2">
          <NuxtLink
            v-for="r in myReports"
            :key="r.id"
            :to="`/whisky/${r.whiskey_id}`"
            class="flex items-center justify-between bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 hover:border-bs-gold/30 transition-all"
          >
            <div>
              <p class="text-sm font-medium text-white">{{ r.whiskeys?.name }}</p>
              <p class="text-xs text-bs-text-tertiary mt-0.5">{{ r.stores?.name }} · {{ timeAgo(r.created_at) }}</p>
            </div>
            <span class="text-bs-gold font-bold tabular-nums">{{ formatPrice(r.price) }}</span>
          </NuxtLink>
        </div>
        <div v-else class="text-center text-bs-text-tertiary py-8 text-sm bg-bs-card border border-bs-border rounded-xl">
          아직 제보한 가격이 없어요
          <NuxtLink to="/report" class="block mt-2 text-bs-gold hover:underline">첫 제보하기 →</NuxtLink>
        </div>
      </section>

      <!-- 내 리뷰 -->
      <section>
        <h2 class="font-serif text-lg font-bold text-white mb-4">내 리뷰 ({{ myReviews.length }})</h2>
        <div v-if="myReviews.length" class="space-y-2">
          <NuxtLink
            v-for="r in myReviews"
            :key="r.id"
            :to="`/whisky/${r.whisky_id}`"
            class="flex items-start justify-between bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 hover:border-bs-gold/30 transition-all"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">{{ r.whiskeys?.name }}</p>
              <p v-if="r.content" class="text-xs text-bs-text-tertiary mt-0.5 truncate">{{ r.content }}</p>
            </div>
            <div class="flex gap-0.5 ml-3 shrink-0">
              <span v-for="i in 5" :key="i" class="text-sm" :class="i <= r.rating ? 'text-bs-gold' : 'text-bs-border-light'">★</span>
            </div>
          </NuxtLink>
        </div>
        <div v-else class="text-center text-bs-text-tertiary py-8 text-sm bg-bs-card border border-bs-border rounded-xl">
          아직 작성한 리뷰가 없어요
        </div>
      </section>
    </template>
  </main>
</template>
