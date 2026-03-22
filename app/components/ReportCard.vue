<script setup lang="ts">
import type { Report } from '~/composables/useBottleScan'

defineProps<{ report: Report }>()

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatPrice(price: number) {
  return '₩' + price.toLocaleString('ko-KR')
}
</script>

<template>
  <NuxtLink
    :to="`/whisky/${report.whiskey_id}`"
    class="group block bg-bs-card border border-bs-border rounded-xl p-5 hover:border-bs-gold/30 hover:bg-bs-card-hover transition-all duration-300"
  >
    <div class="flex justify-between items-start mb-3">
      <div class="min-w-0 flex-1">
        <h3 class="font-serif font-semibold text-white text-lg leading-tight group-hover:text-bs-gold transition-colors">
          {{ report.whiskeys?.name }}
        </h3>
        <p class="text-bs-text-tertiary text-sm mt-0.5">
          {{ report.whiskeys?.name_en }}
        </p>
      </div>
      <span class="text-bs-gold font-bold text-xl whitespace-nowrap ml-4 tabular-nums">
        {{ formatPrice(report.price) }}
      </span>
    </div>

    <div class="flex items-center gap-2 text-sm text-bs-text-secondary">
      <span class="inline-flex items-center gap-1">
        <LMapPin class="w-3.5 h-3.5 text-bs-text-tertiary" />
        {{ report.stores?.name }}
      </span>
      <span class="text-bs-border-light">·</span>
      <span class="text-bs-text-tertiary">{{ report.stores?.region }}</span>
    </div>

    <div class="flex items-center justify-between mt-4 pt-3 border-t border-bs-border">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-bs-border-light flex items-center justify-center text-xs text-bs-text-secondary">
          {{ report.profiles?.nickname?.charAt(0) || 'U' }}
        </div>
        <span class="text-xs text-bs-text-tertiary">{{ report.profiles?.nickname || 'User' }}</span>
      </div>
      <span class="text-xs text-bs-text-tertiary">{{ timeAgo(report.created_at) }}</span>
    </div>

    <p
      v-if="report.note"
      class="mt-3 text-sm text-bs-text-secondary bg-bs-bg rounded-lg px-3 py-2 italic"
    >
      "{{ report.note }}"
    </p>
  </NuxtLink>
</template>
