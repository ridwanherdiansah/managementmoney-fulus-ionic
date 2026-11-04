<script setup lang="ts">
import type { Transaction, TxType } from '~/db'
import { deleteTransaction } from '~/db/repo'
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const route = useRoute()
const b = useBook()
const { confirm, toast } = useUi()

const search = ref('')
const type = ref<TxType | 'all'>('all')
const walletId = ref<string | null>(null)

watch(() => route.query.wallet, (w) => { walletId.value = typeof w === 'string' ? w : null }, { immediate: true })

const FILTERS: Array<{ value: TxType | 'all'; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'expense', label: 'Keluar' },
  { value: 'income', label: 'Masuk' },
  { value: 'transfer', label: 'Transfer' },
]

/** Saat mencari, cari di semua periode */
const filtered = computed<Transaction[]>(() => {
  const q = search.value.trim().toLowerCase()
  const source = q ? b.transactions.value : b.periodTxs.value
  return source.filter((t) => {
    if (type.value !== 'all' && t.type !== type.value) return false
    if (walletId.value && t.walletId !== walletId.value && t.toWalletId !== walletId.value) return false
    if (!q) return true
    const cat = t.categoryId ? b.categoryMap.value.get(t.categoryId)?.name ?? '' : 'transfer'
    const wal = b.walletMap.value.get(t.walletId)?.name ?? ''
    return `${t.note} ${cat} ${wal} ${t.amount}`.toLowerCase().includes(q)
  })
})

const groups = computed(() => groupByDay(filtered.value))
const totalIn = computed(() => sumBy(filtered.value, 'income'))
const totalOut = computed(() => sumBy(filtered.value, 'expense'))
const activeWallet = computed(() => (walletId.value ? b.walletMap.value.get(walletId.value) : undefined))

async function remove(t: Transaction, e: Event) {
  await (e.target as HTMLElement).closest('ion-item-sliding')?.close()
  if (!(await confirm('Hapus transaksi?', `${rupiah(t.amount)} akan dihapus permanen.`))) return
  await deleteTransaction(t.id)
  toast('Transaksi dihapus')
}

function clearWallet() {
  walletId.value = null
  navigateTo({ query: {} }, { replace: true })
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="px-5 pt-2 pb-3">
          <div class="flex items-center justify-between">
            <h1 class="m-0 text-[22px] font-extrabold text-ink">Transaksi</h1>
            <PeriodPicker v-if="!search" :label="b.period.value.label" />
          </div>
          <div class="relative mt-3">
            <Icon name="lucide:search" size="18" class="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <input v-model="search" class="input pl-10" type="search" placeholder="Cari catatan, kategori, nominal…">
          </div>
          <div class="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            <button v-for="f in FILTERS" :key="f.value" class="chip shrink-0" :class="type === f.value && 'chip-active'" @click="type = f.value">
              {{ f.label }}
            </button>
            <button v-if="activeWallet" class="chip chip-active shrink-0" @click="clearWallet">
              <Icon :name="activeWallet.icon" size="14" />{{ activeWallet.name }}<Icon name="lucide:x" size="14" />
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="px-5 pt-1 pb-28">
        <div class="mb-4 grid grid-cols-2 gap-3">
          <div class="card p-3">
            <p class="text-[12px] font-semibold text-muted">Masuk</p>
            <Money :value="totalIn" class="block truncate text-[15px] font-extrabold text-income" />
          </div>
          <div class="card p-3">
            <p class="text-[12px] font-semibold text-muted">Keluar</p>
            <Money :value="totalOut" class="block truncate text-[15px] font-extrabold text-expense" />
          </div>
        </div>

        <p v-if="search" class="mb-3 text-[12px] text-muted">{{ filtered.length }} hasil di semua periode</p>

        <div v-if="groups.length" class="space-y-4">
          <section v-for="g in groups" :key="g.key">
            <div class="mb-1.5 flex items-center justify-between px-1 text-[12px] font-bold">
              <span class="tracking-wide text-muted uppercase">{{ g.label }}</span>
              <span class="flex gap-2">
                <Money v-if="g.income" :value="g.income" sign class="text-income" />
                <Money v-if="g.expense" :value="-g.expense" sign class="text-expense" />
              </span>
            </div>
            <ion-list class="card overflow-hidden !py-1" lines="none">
              <ion-item-sliding v-for="t in g.items" :key="t.id">
                <ion-item class="tx-item">
                  <TxItem :tx="t" :category-map="b.categoryMap.value" :wallet-map="b.walletMap.value" @open="store.openTx(t.type, t.id)" />
                </ion-item>
                <ion-item-options side="end">
                  <ion-item-option color="danger" @click="remove(t, $event)">
                    <Icon name="lucide:trash-2" size="20" />
                  </ion-item-option>
                </ion-item-options>
              </ion-item-sliding>
            </ion-list>
          </section>
        </div>

        <div v-else class="card mt-2">
          <EmptyState
            :title="search ? 'Tidak ditemukan' : 'Belum ada transaksi'"
            :text="search ? 'Coba kata kunci lain.' : 'Transaksi di periode ini akan muncul di sini.'"
            :icon="search ? 'solar:bill-list-bold-duotone' : 'solar:wallet-money-bold-duotone'"
            :action="search ? undefined : 'Tambah transaksi'"
            @action="store.openTx('expense')"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tx-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: #fff;
}
</style>
