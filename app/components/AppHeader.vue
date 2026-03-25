<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const client = useSupabaseClient()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: '매장 찾기', to: '/stores' },
  { label: '커뮤니티', to: '/community' },
]

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const nickname = ref('')

async function loadNickname() {
  const { data: { user: u } } = await client.auth.getUser()
  if (u) {
    const { data } = await client.from('profiles').select('nickname').eq('id', u.id).single()
    nickname.value = data?.nickname || 'User'
  }
}

onMounted(loadNickname)

// 라우트 이동 시 재조회 (닉네임 변경 후 바로 반영)
watch(() => useRoute().path, loadNickname)

async function signOut() {
  await client.auth.signOut()
  showUserMenu.value = false
  navigateTo('/')
}

// 외부 클릭 시 드롭다운 닫기
function onClickOutside() { showUserMenu.value = false }
</script>

<template>
  <header class="sticky top-0 z-50 bg-bs-black/90 backdrop-blur-xl border-b border-bs-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center shrink-0">
        <span class="text-2xl font-logo text-bs-gold tracking-wide">BottleScan</span>
      </NuxtLink>

      <!-- 데스크톱 Nav -->
      <nav class="hidden sm:flex items-center gap-6">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-sm font-medium transition-colors"
          :class="route.path === item.to ? 'text-bs-gold' : 'text-bs-text-secondary hover:text-white'"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- 우측 액션 -->
      <div class="flex items-center gap-2 sm:gap-3">
        <NuxtLink
          to="/report"
          class="hidden sm:inline-flex bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-4 py-2 rounded-lg transition-all text-sm"
        >
          + 제보
        </NuxtLink>

        <!-- 유저 메뉴 -->
        <div v-if="user" class="relative" v-click-outside="onClickOutside">
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bs-card transition-colors"
            @click="showUserMenu = !showUserMenu"
          >
            <div class="w-7 h-7 rounded-full bg-bs-gold/20 flex items-center justify-center text-xs font-bold text-bs-gold">
              {{ nickname.charAt(0) || 'U' }}
            </div>
            <span class="hidden sm:block text-sm text-bs-text-secondary">{{ nickname }}</span>
            <span class="text-bs-text-tertiary text-xs">▾</span>
          </button>

          <Transition name="dropdown">
            <div
              v-if="showUserMenu"
              class="absolute right-0 top-full mt-2 w-44 bg-bs-card border border-bs-border rounded-xl shadow-2xl overflow-hidden"
            >
              <NuxtLink
                to="/profile"
                class="flex items-center gap-2 px-4 py-3 text-sm text-bs-text-secondary hover:text-white hover:bg-bs-card-hover transition-colors"
                @click="showUserMenu = false"
              >
                내 프로필
              </NuxtLink>
              <NuxtLink
                to="/report"
                class="flex items-center gap-2 px-4 py-3 text-sm text-bs-text-secondary hover:text-white hover:bg-bs-card-hover transition-colors border-t border-bs-border"
                @click="showUserMenu = false"
              >
                가격 제보
              </NuxtLink>
              <button
                class="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-bs-card-hover transition-colors border-t border-bs-border"
                @click="signOut"
              >
                로그아웃
              </button>
            </div>
          </Transition>
        </div>

        <NuxtLink
          v-else
          to="/login"
          class="text-bs-text-secondary hover:text-white text-sm transition-colors px-3 py-2"
        >
          로그인
        </NuxtLink>

        <!-- 모바일 햄버거 -->
        <button
          class="sm:hidden p-2 text-bs-text-secondary hover:text-white transition-colors"
          @click="showMobileMenu = !showMobileMenu"
        >
          <span class="block w-5 h-0.5 bg-current mb-1 transition-all" :class="showMobileMenu ? 'rotate-45 translate-y-1.5' : ''" />
          <span class="block w-5 h-0.5 bg-current mb-1 transition-all" :class="showMobileMenu ? 'opacity-0' : ''" />
          <span class="block w-5 h-0.5 bg-current transition-all" :class="showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''" />
        </button>
      </div>
    </div>

    <!-- 모바일 메뉴 -->
    <Transition name="slide-down">
      <div v-if="showMobileMenu" class="sm:hidden border-t border-bs-border bg-bs-black/95">
        <nav class="px-4 py-3 space-y-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="route.path === item.to ? 'text-bs-gold bg-bs-gold/5' : 'text-bs-text-secondary hover:text-white hover:bg-bs-card'"
            @click="showMobileMenu = false"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink
            to="/report"
            class="block px-3 py-2.5 rounded-lg text-sm font-medium text-bs-gold hover:bg-bs-gold/5 transition-colors"
            @click="showMobileMenu = false"
          >
            + 가격 제보
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { transform: translateY(-6px); opacity: 0; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-8px); opacity: 0; }
</style>
