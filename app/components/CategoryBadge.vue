<script setup lang="ts">
const props = withDefaults(defineProps<{ icon: string; color: string; size?: number; rounded?: string }>(), {
  size: 44,
  rounded: 'rounded-2xl',
})
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  color: props.color,
  backgroundColor: `${props.color}1A`,
}))
</script>

<template>
  <div class="grid shrink-0 place-items-center" :class="rounded" :style="style">
    <Icon :name="icon" :size="`${Math.round(size * 0.55)}`" />
  </div>
</template>
