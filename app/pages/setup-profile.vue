<script setup lang="ts">
useHead({ title: 'BottleScan — 닉네임 설정' })

const client = useSupabaseClient()
const nickname = ref('')
const isChecking = ref(false)
const isAvailable = ref<boolean | null>(null)
const isSubmitting = ref(false)
const errorMsg = ref('')

let checkTimeout: ReturnType<typeof setTimeout>

async function checkNickname() {
  const val = nickname.value.trim()
  if (!val || val.length < 2) {
    isAvailable.value = null
    return
  }
  isChecking.value = true
  const { data } = await client
    .from('profiles')
    .select('id')
    .eq('nickname', val)
    .single()
  isAvailable.value = !data
  isChecking.value = false
}

function onInput() {
  isAvailable.value = null
  errorMsg.value = ''
  clearTimeout(checkTimeout)
  checkTimeout = setTimeout(checkNickname, 400)
}

async function submit() {
  const val = nickname.value.trim()
  if (!val || val.length < 2) { errorMsg.value = '2자 이상 입력해주세요'; return }
  if (isAvailable.value === false) { errorMsg.value = '이미 사용 중인 닉네임이에요'; return }

  isSubmitting.value = true
  const { data: { user } } = await client.auth.getUser()
  if (!user) { navigateTo('/login'); return }

  const { error } = await client
    .from('profiles')
    .update({ nickname: val })
    .eq('id', user.id)

  if (error) {
    errorMsg.value = '저장 실패: ' + error.message
    isSubmitting.value = false
    return
  }

  navigateTo('/')
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="font-serif text-2xl font-bold text-white">닉네임을 설정해주세요</h1>
        <p class="text-bs-text-secondary text-sm mt-2">커뮤니티에서 사용할 이름이에요</p>
      </div>

      <div class="bg-bs-card border border-bs-border rounded-2xl p-6">
        <div class="relative mb-2">
          <input
            v-model="nickname"
            type="text"
            placeholder="2~12자, 한글/영문/숫자"
            maxlength="12"
            class="w-full bg-bs-bg border rounded-xl px-4 py-3.5 text-sm text-bs-text-primary placeholder-bs-text-tertiary focus:outline-none transition-colors pr-10"
            :class="isAvailable === true ? 'border-green-500/50' : isAvailable === false ? 'border-red-500/50' : 'border-bs-border focus:border-bs-gold/50'"
            @input="onInput"
            @keyup.enter="submit"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            <span v-if="isChecking" class="w-4 h-4 border-2 border-bs-gold border-t-transparent rounded-full animate-spin block" />
            <span v-else-if="isAvailable === true" class="text-green-400">✓</span>
            <span v-else-if="isAvailable === false" class="text-red-400">✗</span>
          </span>
        </div>

        <p v-if="isAvailable === true" class="text-xs text-green-400 mb-3">사용 가능한 닉네임이에요</p>
        <p v-else-if="isAvailable === false" class="text-xs text-red-400 mb-3">이미 사용 중인 닉네임이에요</p>
        <p v-else-if="errorMsg" class="text-xs text-red-400 mb-3">{{ errorMsg }}</p>
        <div v-else class="mb-3" />

        <button
          class="w-full bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50"
          :disabled="!nickname.trim() || isAvailable === false || isSubmitting"
          @click="submit"
        >
          {{ isSubmitting ? '저장 중...' : '시작하기' }}
        </button>
      </div>
    </div>
  </main>
</template>
