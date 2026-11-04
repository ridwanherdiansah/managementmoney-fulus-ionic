<script setup lang="ts">
import { useAppStore } from '~/stores/app'

defineProps<{ label: string; dark?: boolean }>()
const store = useAppStore()
</script>

<template>
  <div
    class="flex items-center justify-between rounded-full p-1"
    :class="dark ? 'bg-white/15 text-white' : 'border border-line bg-white text-ink'"
  >
    <button class="tap grid size-8 place-items-center rounded-full" aria-label="Periode sebelumnya" @click="store.periodOffset--">
      <Icon name="lucide:chevron-left" size="18" />
    </button>
    <button class="px-2 text-[13px] font-bold" @click="store.periodOffset = 0">
      {{ label }}
    </button>
    <button
      class="tap grid size-8 place-items-center rounded-full disabled:opacity-30"
      aria-label="Periode berikutnya"
      :disabled="store.periodOffset >= 0"
      @click="store.periodOffset++"
    >
      <Icon name="lucide:chevron-right" size="18" />
    </button>
  </div>
</template>
