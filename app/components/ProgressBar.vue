<script setup lang="ts">
const props = withDefaults(defineProps<{ pct: number; height?: string }>(), { height: 'h-2' })
const color = computed(() => {
  if (props.pct > 100) return 'bg-expense'
  if (props.pct >= 80) return 'bg-warn'
  return 'bg-primary'
})
</script>

<template>
  <div class="w-full overflow-hidden rounded-full bg-primary-light" :class="height">
    <div
      class="h-full rounded-full transition-[width] duration-700 ease-out"
      :class="color"
      :style="{ width: `${Math.min(100, Math.max(0, pct))}%` }"
    />
  </div>
</template>
