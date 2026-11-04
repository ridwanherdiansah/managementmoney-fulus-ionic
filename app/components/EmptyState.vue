<script setup lang="ts">
withDefaults(defineProps<{ title: string; text?: string; icon?: string; action?: string }>(), {
  icon: 'solar:wallet-money-bold-duotone',
})
defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-center px-6 py-10 text-center">
    <div class="relative mb-4">
      <div class="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-xl" />
      <div class="relative grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-primary-light to-white text-primary shadow-card">
        <Icon :name="icon" size="40" />
      </div>
    </div>
    <p class="text-[15px] font-bold text-ink">{{ title }}</p>
    <p v-if="text" class="mt-1 max-w-64 text-[13px] text-muted">{{ text }}</p>
    <button v-if="action" class="tap mt-4 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-white shadow-fab" @click="$emit('action')">
      {{ action }}
    </button>
  </div>
</template>
