<template>
  <footer class="border-t border-bs-border mt-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span class="text-xl font-logo text-bs-gold tracking-wide">BottleScan</span>
        </div>
        <div class="flex items-center gap-6 text-sm text-bs-text-tertiary">
          <NuxtLink to="/" class="hover:text-bs-text-secondary transition-colors">Dashboard</NuxtLink>
          <NuxtLink to="/report" class="hover:text-bs-text-secondary transition-colors">Report</NuxtLink>
          <span>About</span>
        </div>
        <p class="text-xs text-bs-text-tertiary">
          © 2026 BottleScan. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
