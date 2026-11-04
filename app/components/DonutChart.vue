<script setup lang="ts">
interface Slice { label: string; color: string; value: number }
const props = withDefaults(defineProps<{ slices: Slice[]; size?: number; thickness?: number }>(), {
  size: 148,
  thickness: 18,
})
defineSlots<{ default(): unknown }>()

const selected = defineModel<number | null>('selected', { default: null })

const r = computed(() => (props.size - props.thickness) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const total = computed(() => props.slices.reduce((s, x) => s + x.value, 0))

const arcs = computed(() => {
  const gap = props.slices.length > 1 ? 3 : 0
  let offset = 0
  return props.slices.map((s) => {
    const len = total.value ? (s.value / total.value) * circ.value : 0
    const arc = { ...s, dash: `${Math.max(0, len - gap)} ${circ.value}`, offset: -offset }
    offset += len
    return arc
  })
})
</script>

<template>
  <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="#E8EFFF" :stroke-width="thickness" />
      <circle
        v-for="(a, i) in arcs"
        :key="i"
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="a.color"
        :stroke-width="selected === i ? thickness + 6 : thickness"
        :stroke-dasharray="a.dash"
        :stroke-dashoffset="a.offset"
        stroke-linecap="round"
        class="cursor-pointer transition-all duration-500"
        :opacity="selected === null || selected === i ? 1 : 0.35"
        @click="selected = selected === i ? null : i"
      />
    </svg>
    <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
      <slot />
    </div>
  </div>
</template>
