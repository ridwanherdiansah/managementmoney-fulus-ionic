<script setup lang="ts">
interface Bar { label: string; value: number; highlight?: boolean }
const props = defineProps<{ bars: Bar[] }>()
const max = computed(() => Math.max(1, ...props.bars.map(b => b.value)))
const active = ref<number | null>(null)
</script>

<template>
  <div>
    <div class="flex h-36 items-end gap-2">
      <button
        v-for="(b, i) in bars"
        :key="i"
        class="group relative flex h-full flex-1 flex-col items-center justify-end"
        @click="active = active === i ? null : i"
      >
        <span
          v-if="active === i || (active === null && b.highlight && b.value > 0)"
          class="absolute -top-1 z-10 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white"
        >
          {{ rupiahShort(b.value) }}
        </span>
        <div
          class="w-full max-w-7 rounded-lg transition-all duration-700 ease-out"
          :class="b.highlight || active === i ? 'bg-gradient-to-t from-primary-dark to-primary' : 'bg-primary/20'"
          :style="{ height: `${Math.max(4, (b.value / max) * 82)}%` }"
        />
      </button>
    </div>
    <div class="mt-2 flex gap-2">
      <span
        v-for="(b, i) in bars"
        :key="i"
        class="flex-1 text-center text-[11px] font-semibold capitalize"
        :class="b.highlight ? 'text-primary' : 'text-muted'"
      >{{ b.label }}</span>
    </div>
  </div>
</template>
