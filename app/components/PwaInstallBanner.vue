<template>
  <Transition name="slide-up">
    <div
      v-if="showBanner"
      class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
    >
      <div class="bg-bs-card border border-bs-gold/30 rounded-xl p-4 shadow-2xl flex items-center gap-3">
        <span class="text-3xl">🥃</span>
        <div class="flex-1 min-w-0">
          <p class="text-bs-text-primary text-sm font-semibold">앱으로 설치하기</p>
          <p class="text-bs-text-secondary text-xs mt-0.5">홈 화면에 추가하면 더 빠르게 접근할 수 있어요</p>
        </div>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button
            @click="install"
            class="bg-bs-gold text-bs-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-bs-gold-light transition-colors"
          >
            설치
          </button>
          <button
            @click="dismiss"
            class="text-bs-text-tertiary text-xs px-3 py-1 rounded-lg hover:text-bs-text-secondary transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()

const showBanner = ref(false)
const dismissed = ref(false)

onMounted(() => {
  // 이미 설치됐거나 닫은 경우 스킵
  if (localStorage.getItem('pwa-install-dismissed')) return

  // PWA install prompt 이벤트 대기
  if ($pwa?.showInstallPrompt) {
    showBanner.value = true
  }

  watch(
    () => $pwa?.showInstallPrompt,
    (val) => {
      if (val && !dismissed.value) showBanner.value = true
    }
  )
})

async function install() {
  showBanner.value = false
  await $pwa?.install()
}

function dismiss() {
  showBanner.value = false
  dismissed.value = true
  localStorage.setItem('pwa-install-dismissed', '1')
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}
</style>
