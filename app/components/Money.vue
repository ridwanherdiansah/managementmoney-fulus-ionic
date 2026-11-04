<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const props = withDefaults(defineProps<{ value: number; sign?: boolean; short?: boolean; maskable?: boolean }>(), {
  sign: false,
  short: false,
  maskable: true,
})
const store = useAppStore()
const text = computed(() => {
  if (props.maskable && store.hideBalance) return 'Rp •••••'
  return props.short ? `Rp ${rupiahShort(props.value)}` : rupiah(props.value, { sign: props.sign })
})
</script>

<template>
  <span class="tabular">{{ text }}</span>
</template>
