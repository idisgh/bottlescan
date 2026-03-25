<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const client = useSupabaseClient()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: '매장 찾기', to: '/stores' },
  { label: '커뮤니티', to: '/community' },
]

async function signOut() {
  await client.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-bs-black/90 backdrop-blur-xl border-b border-bs-border">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center">
        <span class="text-2xl font-logo text-bs-gold tracking-wide">BottleScan</span>
      </NuxtLink>

      <!-- Nav -->
      <nav class="hidden sm:flex items-center gap-8">
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

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/report"
          class="bg-bs-gold hover:bg-bs-gold-light text-bs-black font-semibold px-5 py-2 rounded-lg transition-all text-sm"
        >
          + Report
        </NuxtLink>

        <template v-if="user">
          <button
            class="text-bs-text-secondary hover:text-white text-sm transition-colors"
            @click="signOut"
          >
            Sign Out
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="text-bs-text-secondary hover:text-white text-sm transition-colors"
          >
            Sign In
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
