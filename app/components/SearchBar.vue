<script setup lang="ts">
const query = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: [query: string] }>()
</script>

<template>
  <form class="relative" @submit.prevent="emit('search', query)">
    <LSearch class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bs-text-tertiary" />
    <input
      v-model="query"
      type="text"
      placeholder="Search whisky by name..."
      class="w-full bg-bs-card border border-bs-border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-bs-text-tertiary focus:outline-none focus:border-bs-gold/50 focus:ring-1 focus:ring-bs-gold/20 transition-all"
      @input="emit('search', query)"
    />
  </form>
</template>
