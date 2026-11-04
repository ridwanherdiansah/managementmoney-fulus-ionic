<script setup lang="ts">
defineProps<{ title: string; action?: string }>()
defineEmits<{ action: [] }>()
</script>

<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button default-href="/tabs/more" text="" />
      </ion-buttons>
      <ion-title class="font-extrabold">{{ title }}</ion-title>
      <ion-buttons v-if="action" slot="end">
        <button class="tap mr-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[13px] font-bold text-white" @click="$emit('action')">
          <Icon name="lucide:plus" size="16" />{{ action }}
        </button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>
