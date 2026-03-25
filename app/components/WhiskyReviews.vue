<template>
  <section class="mt-10">
    <h2 class="font-serif text-xl font-bold text-white mb-5">리뷰 & 평점</h2>

    <!-- 평균 별점 -->
    <div v-if="reviews.length" class="bg-bs-card border border-bs-border rounded-xl p-5 mb-5 flex items-center gap-6">
      <div class="text-center">
        <p class="text-4xl font-bold text-bs-gold">{{ avgRating.toFixed(1) }}</p>
        <div class="flex gap-0.5 mt-1 justify-center">
          <span v-for="i in 5" :key="i" class="text-lg" :class="i <= Math.round(avgRating) ? 'text-bs-gold' : 'text-bs-border-light'">★</span>
        </div>
        <p class="text-xs text-bs-text-tertiary mt-1">{{ reviews.length }}개 리뷰</p>
      </div>
      <div class="flex-1 space-y-1.5">
        <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2">
          <span class="text-xs text-bs-text-tertiary w-3">{{ star }}</span>
          <div class="flex-1 h-1.5 bg-bs-border rounded-full overflow-hidden">
            <div
              class="h-full bg-bs-gold rounded-full transition-all"
              :style="{ width: `${ratingPercent(star)}%` }"
            />
          </div>
          <span class="text-xs text-bs-text-tertiary w-4">{{ ratingCount(star) }}</span>
        </div>
      </div>
    </div>

    <!-- 리뷰 작성 -->
    <div v-if="user" class="bg-bs-card border border-bs-border rounded-xl p-5 mb-5">
      <p class="text-sm font-semibold text-white mb-3">{{ myReview ? '내 리뷰 수정' : '리뷰 작성' }}</p>
      <div class="flex gap-1 mb-3">
        <button
          v-for="i in 5" :key="i"
          class="text-2xl transition-transform hover:scale-110"
          :class="i <= form.rating ? 'text-bs-gold' : 'text-bs-border-light'"
          @click="form.rating = i"
        >★</button>
      </div>
      <textarea
        v-model="form.content"
        placeholder="이 위스키에 대한 솔직한 리뷰를 남겨주세요..."
        rows="3"
        class="w-full bg-bs-bg border border-bs-border rounded-lg px-3 py-2.5 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 resize-none"
      />
      <div class="flex justify-end gap-2 mt-3">
        <button
          v-if="myReview"
          class="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 transition-colors"
          @click="deleteReview"
        >삭제</button>
        <button
          class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold text-sm px-5 py-2 rounded-lg transition-all disabled:opacity-50"
          :disabled="!form.rating || isSubmitting"
          @click="submitReview"
        >
          {{ isSubmitting ? '저장 중...' : (myReview ? '수정' : '등록') }}
        </button>
      </div>
    </div>
    <div v-else class="text-center py-4 mb-5">
      <NuxtLink to="/login" class="text-bs-gold text-sm hover:underline">로그인하고 리뷰 작성하기 →</NuxtLink>
    </div>

    <!-- 리뷰 목록 -->
    <div v-if="reviews.length" class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-bs-card border border-bs-border rounded-xl p-4"
        :class="{ 'border-bs-gold/20': review.user_id === user?.id }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-bs-border-light flex items-center justify-center text-xs font-semibold text-bs-text-secondary">
              {{ review.profiles?.nickname?.charAt(0) || 'U' }}
            </div>
            <span class="text-sm font-medium text-bs-text-primary">{{ review.profiles?.nickname || 'User' }}</span>
          </div>
          <div class="flex gap-0.5">
            <span v-for="i in 5" :key="i" class="text-sm" :class="i <= review.rating ? 'text-bs-gold' : 'text-bs-border-light'">★</span>
          </div>
        </div>
        <p v-if="review.content" class="text-sm text-bs-text-secondary mt-2.5 leading-relaxed">{{ review.content }}</p>
        <p class="text-xs text-bs-text-tertiary mt-2">{{ timeAgo(review.created_at) }}</p>
      </div>
    </div>
    <div v-else class="text-center text-bs-text-tertiary py-8 text-sm">
      아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ whiskyId: string }>()
const client = useSupabaseClient()
const user = useSupabaseUser()

const reviews = ref<any[]>([])
const myReview = ref<any>(null)
const isSubmitting = ref(false)
const form = ref({ rating: 0, content: '' })

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
})
const ratingCount = (star: number) => reviews.value.filter(r => r.rating === star).length
const ratingPercent = (star: number) => reviews.value.length ? (ratingCount(star) / reviews.value.length) * 100 : 0

async function fetchReviews() {
  const { data } = await client
    .from('reviews')
    .select('*')
    .eq('whisky_id', props.whiskyId)
    .order('created_at', { ascending: false })

  const userIds = [...new Set((data || []).map((r: any) => r.user_id))]
  let profileMap: Record<string, string> = {}
  if (userIds.length) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds)
    profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.nickname]))
  }
  reviews.value = (data || []).map((r: any) => ({
    ...r,
    profiles: { nickname: profileMap[r.user_id] || 'User' },
  }))

  if (user.value) {
    myReview.value = reviews.value.find(r => r.user_id === user.value!.id) || null
    if (myReview.value) {
      form.value = { rating: myReview.value.rating, content: myReview.value.content || '' }
    }
  }
}

async function submitReview() {
  if (!form.value.rating || !user.value) return
  isSubmitting.value = true
  try {
    if (myReview.value) {
      await client.from('reviews').update({ rating: form.value.rating, content: form.value.content }).eq('id', myReview.value.id)
    } else {
      await client.from('reviews').insert({ whisky_id: props.whiskyId, user_id: user.value.id, rating: form.value.rating, content: form.value.content })
    }
    await fetchReviews()
  } finally {
    isSubmitting.value = false
  }
}

async function deleteReview() {
  if (!myReview.value) return
  await client.from('reviews').delete().eq('id', myReview.value.id)
  form.value = { rating: 0, content: '' }
  myReview.value = null
  await fetchReviews()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

onMounted(fetchReviews)
</script>
