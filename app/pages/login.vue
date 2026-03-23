<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 이미 로그인되어 있으면 홈으로
watch(user, (val) => {
  if (val) router.push('/')
}, { immediate: true })

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isSignUp.value) {
      const { error } = await client.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      successMsg.value = 'Check your email to confirm your account!'
    } else {
      const { error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      router.push('/')
    }
  } catch (e: any) {
    errorMsg.value = e.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="max-w-sm mx-auto px-4 py-16">
    <div class="text-center mb-8">
      <span class="text-3xl font-logo text-bs-gold">BottleScan</span>
      <p class="text-bs-text-tertiary mt-2">{{ isSignUp ? 'Create an account' : 'Sign in to your account' }}</p>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div v-if="errorMsg" class="bg-bs-red/10 border border-bs-red/30 rounded-xl p-3 text-bs-red text-sm">
        {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="bg-bs-green/10 border border-bs-green/30 rounded-xl p-3 text-bs-green text-sm">
        {{ successMsg }}
      </div>

      <div>
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="you@email.com"
          required
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold tracking-wider text-bs-text-secondary uppercase mb-2">Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          minlength="6"
          class="w-full bg-bs-card border border-bs-border rounded-xl px-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-bs-gold hover:bg-bs-gold-light disabled:bg-bs-border disabled:text-bs-text-tertiary text-bs-black font-semibold py-3.5 rounded-xl transition-all"
      >
        {{ loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
      </button>
    </form>

    <!-- 구분선 -->
    <div class="flex items-center gap-3 my-6">
      <div class="flex-1 h-px bg-bs-border"></div>
      <span class="text-bs-text-tertiary text-xs">또는</span>
      <div class="flex-1 h-px bg-bs-border"></div>
    </div>

    <!-- 네이버 로그인 -->
    <a
      href="/api/auth/naver"
      class="flex items-center justify-center gap-3 w-full bg-[#03C75A] hover:bg-[#02b351] text-white font-semibold py-3.5 rounded-xl transition-all"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
      </svg>
      네이버로 로그인
    </a>

    <p class="text-center text-bs-text-tertiary text-sm mt-6">
      {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
      <button class="text-bs-gold hover:underline ml-1" @click="isSignUp = !isSignUp; errorMsg = ''; successMsg = ''">
        {{ isSignUp ? 'Sign In' : 'Sign Up' }}
      </button>
    </p>
  </main>
</template>
