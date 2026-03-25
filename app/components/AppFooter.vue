<template>
  <footer class="border-t border-bs-border mt-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span class="text-xl font-logo text-bs-gold tracking-wide">BottleScan</span>
          <p class="text-xs text-bs-text-tertiary mt-1">위스키 가격을 제보하고, 최저가를 찾아보세요</p>
        </div>
        <div class="flex items-center gap-6 text-sm text-bs-text-tertiary">
          <NuxtLink to="/" class="hover:text-bs-text-secondary transition-colors">대시보드</NuxtLink>
          <NuxtLink to="/stores" class="hover:text-bs-text-secondary transition-colors">매장 찾기</NuxtLink>
          <NuxtLink to="/community" class="hover:text-bs-text-secondary transition-colors">커뮤니티</NuxtLink>
          <NuxtLink to="/report" class="hover:text-bs-text-secondary transition-colors">가격 제보</NuxtLink>
        </div>
        <p class="text-xs text-bs-text-tertiary">
          © 2026 BottleScan
        </p>
      </div>
    </div>
  </footer>
</template>
