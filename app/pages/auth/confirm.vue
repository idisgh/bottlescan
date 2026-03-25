<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const tokenHash = route.query.token_hash as string
  const type = route.query.type as string
  const next = (route.query.next as string) || '/'

  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    if (!error) {
      // 닉네임 미설정 확인
      const { data: { user } } = await client.auth.getUser()
      if (user) {
        const { data: profile } = await client
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single()
        if (!profile?.nickname || profile.nickname === 'User') {
          router.replace('/setup-profile')
          return
        }
      }
      router.replace(next)
      return
    }
  }
  // 실패 시 로그인 페이지로
  router.replace('/login?error=auth_failed')
})
</script>

<template>
  <main class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-bs-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-bs-text-secondary text-sm">로그인 처리 중...</p>
    </div>
  </main>
</template>
