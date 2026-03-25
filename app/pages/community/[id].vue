<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const user = useSupabaseUser()

const postId = route.params.id as string
const post = ref<any>(null)
const comments = ref<any[]>([])
const commentText = ref('')
const isSubmitting = ref(false)
const liked = ref(false)

async function fetchPost() {
  const { data } = await client
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()
  if (data) {
    const { data: profile } = await client
      .from('profiles')
      .select('nickname')
      .eq('id', data.user_id)
      .single()
    post.value = { ...data, profiles: profile }
  }

  const { data: { user: sessionUser } } = await client.auth.getUser()
  if (sessionUser) {
    const { data: like } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', sessionUser.id)
      .single()
    liked.value = !!like
  }
}

async function fetchComments() {
  const { data } = await client
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const userIds = [...new Set((data || []).map((c: any) => c.user_id))]
  let profileMap: Record<string, string> = {}
  if (userIds.length) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds)
    profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.nickname]))
  }
  comments.value = (data || []).map((c: any) => ({
    ...c,
    profiles: { nickname: profileMap[c.user_id] || 'User' },
  }))
}

async function submitComment() {
  if (!commentText.value.trim()) return
  const { data: { user: sessionUser } } = await client.auth.getUser()
  if (!sessionUser) { navigateTo('/login'); return }
  isSubmitting.value = true
  try {
    await client.from('comments').insert({
      post_id: postId,
      user_id: sessionUser.id,
      content: commentText.value.trim(),
    })
    commentText.value = ''
    await fetchComments()
  } finally {
    isSubmitting.value = false
  }
}

async function deleteComment(commentId: string) {
  await client.from('comments').delete().eq('id', commentId)
  await fetchComments()
}

async function toggleLike() {
  const { data: { user: sessionUser } } = await client.auth.getUser()
  if (!sessionUser) { navigateTo('/login'); return }
  if (liked.value) {
    await client.from('post_likes').delete().eq('post_id', postId).eq('user_id', sessionUser.id)
    post.value.likes = Math.max(0, post.value.likes - 1)
    liked.value = false
  } else {
    await client.from('post_likes').insert({ post_id: postId, user_id: sessionUser.id })
    post.value.likes = (post.value.likes || 0) + 1
    liked.value = true
  }
  await client.from('posts').update({ likes: post.value.likes }).eq('id', postId)
}

async function deletePost() {
  if (!confirm('게시글을 삭제할까요?')) return
  await client.from('posts').delete().eq('id', postId)
  navigateTo('/community')
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

useHead(() => ({ title: post.value ? `${post.value.title} — BottleScan` : 'BottleScan' }))

onMounted(async () => {
  await fetchPost()
  await fetchComments()
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <NuxtLink to="/community" class="inline-flex items-center gap-1 text-bs-text-tertiary hover:text-bs-text-secondary text-sm mb-6 transition-colors">
      ← 커뮤니티
    </NuxtLink>

    <template v-if="post">
      <!-- 게시글 -->
      <article class="bg-bs-card border border-bs-border rounded-2xl p-6 mb-6">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs bg-bs-border px-2 py-0.5 rounded text-bs-text-secondary">{{ post.category }}</span>
        </div>
        <h1 class="font-serif text-2xl font-bold text-white leading-snug">{{ post.title }}</h1>
        <div class="flex items-center gap-3 mt-3 mb-5 text-xs text-bs-text-tertiary">
          <div class="flex items-center gap-1.5">
            <div class="w-5 h-5 rounded-full bg-bs-border-light flex items-center justify-center text-[10px]">
              {{ post.profiles?.nickname?.charAt(0) || 'U' }}
            </div>
            <span>{{ post.profiles?.nickname || 'User' }}</span>
          </div>
          <span>{{ timeAgo(post.created_at) }}</span>
          <button
            v-if="user?.id === post.user_id"
            class="ml-auto text-red-400 hover:text-red-300 transition-colors"
            @click="deletePost"
          >삭제</button>
        </div>
        <p class="text-bs-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{{ post.content }}</p>

        <!-- 좋아요 -->
        <div class="mt-6 pt-4 border-t border-bs-border flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border transition-all"
            :class="liked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-bs-border text-bs-text-tertiary hover:border-bs-border-light'"
            @click="toggleLike"
          >
            <span>❤️</span>
            <span>{{ post.likes || 0 }}</span>
          </button>
          <span class="text-xs text-bs-text-tertiary">댓글 {{ comments.length }}</span>
        </div>
      </article>

      <!-- 댓글 -->
      <section>
        <h2 class="font-semibold text-white text-sm mb-4">댓글 {{ comments.length }}</h2>

        <!-- 댓글 작성 -->
        <div v-if="user" class="flex gap-3 mb-5">
          <div class="w-7 h-7 rounded-full bg-bs-border-light flex items-center justify-center text-xs font-semibold text-bs-text-secondary shrink-0 mt-1">
            {{ user.email?.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1">
            <textarea
              v-model="commentText"
              placeholder="댓글을 입력하세요..."
              rows="2"
              class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 resize-none"
            />
            <div class="flex justify-end mt-2">
              <button
                class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                :disabled="!commentText.trim() || isSubmitting"
                @click="submitComment"
              >등록</button>
            </div>
          </div>
        </div>
        <div v-else class="mb-5">
          <NuxtLink to="/login" class="text-bs-gold text-sm hover:underline">로그인하고 댓글 달기 →</NuxtLink>
        </div>

        <!-- 댓글 목록 -->
        <div class="space-y-3">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="flex gap-3"
          >
            <div class="w-7 h-7 rounded-full bg-bs-border-light flex items-center justify-center text-xs font-semibold text-bs-text-secondary shrink-0 mt-0.5">
              {{ comment.profiles?.nickname?.charAt(0) || 'U' }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-bs-text-primary">{{ comment.profiles?.nickname || 'User' }}</span>
                <span class="text-xs text-bs-text-tertiary">{{ timeAgo(comment.created_at) }}</span>
                <button
                  v-if="user?.id === comment.user_id"
                  class="ml-auto text-xs text-bs-text-tertiary hover:text-red-400 transition-colors"
                  @click="deleteComment(comment.id)"
                >삭제</button>
              </div>
              <p class="text-sm text-bs-text-secondary leading-relaxed">{{ comment.content }}</p>
            </div>
          </div>
        </div>

        <div v-if="!comments.length" class="text-center text-bs-text-tertiary py-8 text-sm">
          첫 댓글을 남겨보세요!
        </div>
      </section>
    </template>

    <div v-else class="text-center py-24 text-bs-text-tertiary">
      <p>게시글을 찾을 수 없어요</p>
    </div>
  </main>
</template>
