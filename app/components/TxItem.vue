<script setup lang="ts">
import type { Category, Transaction, Wallet } from '~/db'

const props = defineProps<{
  tx: Transaction
  categoryMap: Map<string, Category>
  walletMap: Map<string, Wallet>
}>()
defineEmits<{ open: [] }>()

const category = computed(() => (props.tx.categoryId ? props.categoryMap.get(props.tx.categoryId) : undefined))
const wallet = computed(() => props.walletMap.get(props.tx.walletId))
const toWallet = computed(() => (props.tx.toWalletId ? props.walletMap.get(props.tx.toWalletId) : undefined))

const view = computed(() => {
  const t = props.tx
  if (t.type === 'transfer') {
    return {
      icon: 'lucide:arrow-left-right', color: '#1E5EFF', title: 'Transfer',
      sub: `${wallet.value?.name ?? '?'} → ${toWallet.value?.name ?? '?'}`,
      amount: t.amount, cls: 'text-ink', sign: false,
    }
  }
  return {
    icon: category.value?.icon ?? 'solar:menu-dots-bold-duotone',
    color: category.value?.color ?? '#64748B',
    title: category.value?.name ?? 'Tanpa kategori',
    sub: wallet.value?.name ?? '',
    amount: t.type === 'expense' ? -t.amount : t.amount,
    cls: t.type === 'expense' ? 'text-expense' : 'text-income',
    sign: true,
  }
})
</script>

<template>
  <button class="tap flex w-full items-center gap-3 px-4 py-3 text-left" @click="$emit('open')">
    <CategoryBadge :icon="view.icon" :color="view.color" :size="42" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-[14px] font-semibold text-ink">{{ view.title }}</p>
      <p class="truncate text-[12px] text-muted">
        <span v-if="tx.note">{{ tx.note }} · </span>{{ view.sub }}
      </p>
    </div>
    <Money :value="view.amount" :sign="view.sign" class="text-[14px] font-bold" :class="view.cls" />
  </button>
</template>
