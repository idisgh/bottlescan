<script setup lang="ts">
useHead({ title: 'BottleScan — 커뮤니티' })

const client = useSupabaseClient()
const user = useSupabaseUser()

const posts = ref<any[]>([])
const isLoading = ref(true)
const selectedCategory = ref('전체')
const showWriteForm = ref(false)
const isSubmitting = ref(false)

const categories = ['전체', '자유', '위스키 추천', '구매 후기', '질문']

const form = ref({ title: '', content: '', category: '자유' })

const filteredPosts = computed(() =>
  selectedCategory.value === '전체'
    ? posts.value
    : posts.value.filter(p => p.category === selectedCategory.value)
)

async function fetchPosts() {
  isLoading.value = true
  const { data } = await client
    .from('posts')
    .select('*, profiles(nickname)')
    .order('created_at', { ascending: false })
  posts.value = data || []
  isLoading.value = false
}

async function submitPost() {
  if (!form.value.title.trim() || !form.value.content.trim() || !user.value) return
  isSubmitting.value = true
  try {
    const { error } = await client.from('posts').insert({
      user_id: user.value.id,
      title: form.value.title,
      content: form.value.content,
      category: form.value.category,
    })
    if (error) {
      console.error('posts insert error:', error)
      alert('등록 실패: ' + error.message)
      return
    }
    form.value = { title: '', content: '', category: '자유' }
    showWriteForm.value = false
    await fetchPosts()
  } finally {
    isSubmitting.value = false
  }
}

async function toggleLike(post: any) {
  if (!user.value) { navigateTo('/login'); return }

  const { data: existing } = await client
    .from('post_likes')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', user.value.id)
    .single()

  if (existing) {
    await client.from('post_likes').delete().eq('id', existing.id)
    post.likes = Math.max(0, post.likes - 1)
    post._liked = false
  } else {
    await client.from('post_likes').insert({ post_id: post.id, user_id: user.value.id })
    post.likes = (post.likes || 0) + 1
    post._liked = true
  }
  await client.from('posts').update({ likes: post.likes }).eq('id', post.id)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

onMounted(fetchPosts)
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-serif text-3xl font-bold text-white">커뮤니티</h1>
        <p class="text-bs-text-secondary mt-1 text-sm">위스키 이야기를 나눠보세요</p>
      </div>
      <button
        v-if="user"
        class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
        @click="showWriteForm = !showWriteForm"
      >
        {{ showWriteForm ? '취소' : '✏️ 글쓰기' }}
      </button>
      <NuxtLink v-else to="/login" class="text-bs-gold text-sm hover:underline">로그인</NuxtLink>
    </div>

    <!-- 글쓰기 폼 -->
    <Transition name="slide-down">
      <div v-if="showWriteForm" class="bg-bs-card border border-bs-gold/30 rounded-2xl p-5 mb-6">
        <div class="flex gap-2 mb-4">
          <button
            v-for="cat in categories.slice(1)"
            :key="cat"
            class="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            :class="form.category === cat ? 'bg-bs-gold/10 border-bs-gold/50 text-bs-gold' : 'border-bs-border text-bs-text-tertiary hover:border-bs-border-light'"
            @click="form.category = cat"
          >{{ cat }}</button>
        </div>
        <input
          v-model="form.title"
          type="text"
          placeholder="제목"
          class="w-full bg-bs-bg border border-bs-border rounded-lg px-4 py-3 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 mb-3"
        />
        <textarea
          v-model="form.content"
          placeholder="내용을 입력하세요..."
          rows="5"
          class="w-full bg-bs-bg border border-bs-border rounded-lg px-4 py-3 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 resize-none"
        />
        <div class="flex justify-end mt-3">
          <button
            class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
            :disabled="!form.title.trim() || !form.content.trim() || isSubmitting"
            @click="submitPost"
          >
            {{ isSubmitting ? '등록 중...' : '등록' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 카테고리 필터 -->
    <div class="flex gap-2 mb-5 overflow-x-auto pb-1">
      <button
        v-for="cat in categories"
        :key="cat"
        class="shrink-0 text-xs px-4 py-2 rounded-full border transition-colors"
        :class="selectedCategory === cat ? 'bg-bs-gold text-bs-black border-bs-gold font-semibold' : 'border-bs-border text-bs-text-secondary hover:border-bs-border-light'"
        @click="selectedCategory = cat"
      >{{ cat }}</button>
    </div>

    <!-- 게시글 목록 -->
    <div v-if="isLoading" class="text-center py-16">
      <div class="w-6 h-6 border-2 border-bs-gold border-t-transparent rounded-full animate-spin mx-auto" />
    </div>

    <div v-else-if="filteredPosts.length" class="space-y-3">
      <NuxtLink
        v-for="post in filteredPosts"
        :key="post.id"
        :to="`/community/${post.id}`"
        class="block bg-bs-card border border-bs-border rounded-xl p-5 hover:border-bs-gold/30 transition-all"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] bg-bs-border px-2 py-0.5 rounded text-bs-text-secondary">{{ post.category }}</span>
            </div>
            <p class="font-semibold text-white text-sm leading-snug">{{ post.title }}</p>
            <p class="text-bs-text-tertiary text-xs mt-1.5 line-clamp-2">{{ post.content }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-3 text-xs text-bs-text-tertiary">
          <div class="flex items-center gap-1">
            <div class="w-4 h-4 rounded-full bg-bs-border-light flex items-center justify-center text-[9px]">
              {{ post.profiles?.nickname?.charAt(0) || 'U' }}
            </div>
            <span>{{ post.profiles?.nickname || 'User' }}</span>
          </div>
          <span>{{ timeAgo(post.created_at) }}</span>
          <span class="ml-auto flex items-center gap-1">❤️ {{ post.likes || 0 }}</span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="text-center text-bs-text-tertiary py-16">
      <p class="text-4xl mb-3">🥃</p>
      <p class="font-serif text-lg text-white">아직 게시글이 없어요</p>
      <p class="text-sm mt-1">첫 번째 이야기를 시작해보세요!</p>
    </div>
  </main>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-10px); opacity: 0; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
