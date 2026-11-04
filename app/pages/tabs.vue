<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()

const TABS = [
  { tab: 'home', href: '/tabs/home', label: 'Beranda', icon: 'solar:home-2-bold-duotone' },
  { tab: 'transactions', href: '/tabs/transactions', label: 'Transaksi', icon: 'solar:bill-list-bold-duotone' },
  { tab: 'budget', href: '/tabs/budget', label: 'Budget', icon: 'solar:pie-chart-2-bold-duotone' },
  { tab: 'more', href: '/tabs/more', label: 'Lainnya', icon: 'solar:widget-5-bold-duotone' },
]
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="tabbar">
        <ion-tab-button v-for="t in TABS.slice(0, 2)" :key="t.tab" :tab="t.tab" :href="t.href">
          <Icon :name="t.icon" size="24" />
          <ion-label>{{ t.label }}</ion-label>
        </ion-tab-button>

        <div class="flex w-[72px] shrink-0 items-start justify-center">
          <button
            class="-mt-5 grid size-14 place-items-center rounded-[20px] bg-gradient-to-br from-primary to-primary-dark text-white shadow-fab transition active:scale-90"
            aria-label="Tambah transaksi"
            @click="store.openTx('expense')"
          >
            <Icon name="lucide:plus" size="28" />
          </button>
        </div>

        <ion-tab-button v-for="t in TABS.slice(2)" :key="t.tab" :tab="t.tab" :href="t.href">
          <Icon :name="t.icon" size="24" />
          <ion-label>{{ t.label }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <TxSheet />
    <BookSheet />
  </ion-page>
</template>

<style scoped>
.tabbar {
  --border: 1px solid #e6ecf8;
  height: calc(64px + var(--ion-safe-area-bottom, 0px));
  overflow: visible;
  contain: none;
}
.tabbar ion-tab-button {
  --padding-top: 6px;
  font-weight: 600;
}
.tabbar ion-label {
  font-size: 11px;
  margin-top: 2px;
}
</style>
