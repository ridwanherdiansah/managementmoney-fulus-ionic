<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const router = useIonRouter()
const d = useDashboard()

const chartMode = ref<'week' | 'month'>('week')
const selectedSlice = ref<number | null>(null)
watch(() => d.categorySlices.value, () => (selectedSlice.value = null))

const recentGroups = computed(() => groupByDay(d.periodTxs.value.slice(0, 6)))
const budgetPct = computed(() => (d.budgetTotal.value ? (d.budgetSpent.value / d.budgetTotal.value) * 100 : 0))

const sliceCenter = computed(() => {
  const s = selectedSlice.value !== null ? d.categorySlices.value[selectedSlice.value] : null
  return s ? { label: s.label, value: s.value } : { label: 'Total', value: d.expense.value }
})

const showBackupReminder = computed(() => {
  if (d.transactions.value.length < 10) return false
  return !store.lastBackupAt || Date.now() - store.lastBackupAt > 14 * 86_400_000
})

const QUICK = [
  { label: 'Keluar', icon: 'lucide:arrow-up-right', cls: 'bg-expense/10 text-expense', action: () => store.openTx('expense') },
  { label: 'Masuk', icon: 'lucide:arrow-down-left', cls: 'bg-income/10 text-income', action: () => store.openTx('income') },
  { label: 'Transfer', icon: 'lucide:arrow-left-right', cls: 'bg-primary-light text-primary', action: () => store.openTx('transfer') },
  { label: 'Budget', icon: 'solar:pie-chart-2-bold-duotone', cls: 'bg-warn/10 text-warn', action: () => router.navigate('/tabs/budget', 'root') },
]

function openWallet(id: string) {
  router.navigate({ path: '/tabs/transactions', query: { wallet: id } }, 'root')
}

function refresh(e: CustomEvent) {
  setTimeout(() => (e.target as HTMLIonRefresherElement).complete(), 500)
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ion-refresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <!-- ===== Hero ===== -->
      <section class="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#2B6BFF] via-primary to-primary-dark px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-24 text-white">
        <div class="pointer-events-none absolute -top-16 -right-20 size-64 rounded-full bg-white/10" />
        <div class="pointer-events-none absolute top-24 -left-24 size-56 rounded-full bg-white/5" />

        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-[13px] text-white/75">{{ greeting() }}{{ store.userName ? ',' : '' }} 👋</p>
            <p class="text-[17px] font-extrabold">{{ store.userName || 'Selamat datang' }}</p>
          </div>
          <button class="tap flex items-center gap-1.5 rounded-full bg-white/15 py-1.5 pr-3 pl-1.5 backdrop-blur" @click="store.bookSheetOpen = true">
            <span class="grid size-7 place-items-center rounded-full bg-white text-primary">
              <Icon :name="d.book.value?.icon ?? 'solar:book-bold-duotone'" size="16" />
            </span>
            <span class="max-w-28 truncate text-[13px] font-bold">{{ d.book.value?.name ?? '…' }}</span>
            <Icon name="lucide:chevron-down" size="16" />
          </button>
        </div>

        <div class="relative mt-6">
          <div class="flex items-center gap-2 text-[13px] text-white/75">
            Total saldo
            <button class="tap grid size-7 place-items-center rounded-full bg-white/10" :aria-label="store.hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'" @click="store.toggleHideBalance()">
              <Icon :name="store.hideBalance ? 'lucide:eye-off' : 'lucide:eye'" size="15" />
            </button>
          </div>
          <p class="mt-1 text-[34px] leading-tight font-extrabold tracking-tight">
            <Money :value="d.totalBalance.value" />
          </p>
        </div>

        <PeriodPicker class="relative mt-5" dark :label="d.period.value.label" />
      </section>

      <div class="relative -mt-16 space-y-6 px-5 pb-28">
        <!-- ===== Ringkasan periode ===== -->
        <section class="card p-4">
          <div class="grid grid-cols-2 divide-x divide-line">
            <div class="pr-3">
              <div class="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <span class="grid size-5 place-items-center rounded-full bg-income/10 text-income"><Icon name="lucide:arrow-down-left" size="12" /></span>
                Pemasukan
              </div>
              <Money :value="d.income.value" class="mt-1 block truncate text-[16px] font-extrabold text-income" />
            </div>
            <div class="pl-4">
              <div class="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                <span class="grid size-5 place-items-center rounded-full bg-expense/10 text-expense"><Icon name="lucide:arrow-up-right" size="12" /></span>
                Pengeluaran
              </div>
              <Money :value="d.expense.value" class="mt-1 block truncate text-[16px] font-extrabold text-expense" />
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-[12px]">
            <span class="font-semibold" :class="d.net.value >= 0 ? 'text-income' : 'text-expense'">
              {{ d.net.value >= 0 ? 'Surplus' : 'Defisit' }} <Money :value="Math.abs(d.net.value)" />
            </span>
            <span v-if="d.expenseChangePct.value !== null" class="flex items-center gap-1 font-semibold" :class="d.expenseChangePct.value > 0 ? 'text-expense' : 'text-income'">
              <Icon :name="d.expenseChangePct.value > 0 ? 'lucide:trending-up' : 'lucide:trending-down'" size="14" />
              {{ Math.abs(Math.round(d.expenseChangePct.value)) }}% vs periode lalu
            </span>
          </div>
        </section>

        <!-- ===== Aksi cepat ===== -->
        <section class="grid grid-cols-4 gap-3">
          <button v-for="q in QUICK" :key="q.label" class="tap flex flex-col items-center gap-1.5" @click="q.action">
            <span class="grid size-13 place-items-center rounded-2xl bg-white shadow-card">
              <span class="grid size-9 place-items-center rounded-xl" :class="q.cls"><Icon :name="q.icon" size="20" /></span>
            </span>
            <span class="text-[12px] font-semibold text-ink">{{ q.label }}</span>
          </button>
        </section>

        <!-- ===== Dompet ===== -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="section-title m-0">Dompet</h3>
            <NuxtLink to="/wallets" class="text-[13px] font-bold text-primary">Kelola</NuxtLink>
          </div>
          <div class="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            <button
              v-for="w in d.wallets.value"
              :key="w.id"
              class="tap card flex w-40 shrink-0 flex-col p-3.5 text-left"
              @click="openWallet(w.id)"
            >
              <CategoryBadge :icon="w.icon" :color="w.color" :size="36" rounded="rounded-xl" />
              <p class="mt-3 truncate text-[12px] font-semibold text-muted">{{ w.name }}</p>
              <Money :value="d.walletBalances.value.get(w.id) ?? 0" class="truncate text-[15px] font-extrabold text-ink" />
            </button>
            <NuxtLink to="/wallets" class="tap flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-primary/25 text-primary">
              <Icon name="lucide:plus" size="22" />
              <span class="text-[12px] font-bold">Tambah</span>
            </NuxtLink>
          </div>
        </section>

        <!-- ===== Budget ===== -->
        <section class="card p-4">
          <div class="flex items-center justify-between">
            <h3 class="section-title m-0">Budget periode ini</h3>
            <NuxtLink to="/tabs/budget" class="text-[13px] font-bold text-primary">Lihat semua</NuxtLink>
          </div>

          <template v-if="d.budgetRows.value.length">
            <div class="mt-3 flex items-end justify-between">
              <p class="text-[13px] text-muted">
                Terpakai <Money :value="d.budgetSpent.value" class="font-bold text-ink" />
                dari <Money :value="d.budgetTotal.value" />
              </p>
              <span class="text-[13px] font-extrabold" :class="budgetPct > 100 ? 'text-expense' : budgetPct >= 80 ? 'text-warn' : 'text-primary'">
                {{ Math.round(budgetPct) }}%
              </span>
            </div>
            <ProgressBar :pct="budgetPct" height="h-2.5" class="mt-2" />
            <p v-if="d.perDayLeft.value !== null" class="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
              <Icon name="lucide:sparkles" size="14" class="text-primary" />
              Sisa <Money :value="d.perDayLeft.value" class="font-bold text-ink" />/hari untuk {{ d.daysLeft.value }} hari lagi
            </p>

            <div class="mt-4 space-y-3.5">
              <div v-for="r in d.budgetRows.value.slice(0, 3)" :key="r.category.id" class="flex items-center gap-3">
                <CategoryBadge :icon="r.category.icon" :color="r.category.color" :size="36" rounded="rounded-xl" />
                <div class="min-w-0 flex-1">
                  <div class="flex justify-between text-[13px]">
                    <span class="truncate font-semibold text-ink">{{ r.category.name }}</span>
                    <span class="shrink-0 font-semibold text-muted"><Money :value="r.spent" short /> / <Money :value="r.budget" short /></span>
                  </div>
                  <ProgressBar :pct="r.pct" class="mt-1.5" />
                </div>
              </div>
            </div>
          </template>
          <div v-else class="mt-3 flex items-center gap-3 rounded-xl bg-primary-light p-3">
            <Icon name="solar:pie-chart-2-bold-duotone" size="28" class="text-primary" />
            <p class="flex-1 text-[13px] text-ink">Atur budget per kategori biar pengeluaran lebih terkontrol.</p>
            <NuxtLink to="/tabs/budget" class="rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-white">Atur</NuxtLink>
          </div>
        </section>

        <!-- ===== Analisis ===== -->
        <section class="card p-4">
          <h3 class="section-title m-0">Analisis pengeluaran</h3>

          <div v-if="d.categorySlices.value.length" class="mt-4 flex items-center gap-4">
            <DonutChart v-model:selected="selectedSlice" :slices="d.categorySlices.value" :size="132" :thickness="16">
              <div class="max-w-20">
                <p class="truncate text-[11px] font-semibold text-muted">{{ sliceCenter.label }}</p>
                <Money :value="sliceCenter.value" short class="text-[14px] font-extrabold text-ink" />
              </div>
            </DonutChart>
            <ul class="m-0 min-w-0 flex-1 list-none space-y-2 p-0">
              <li
                v-for="(s, i) in d.categorySlices.value"
                :key="s.label"
                class="flex cursor-pointer items-center gap-2 text-[12px] transition"
                :class="selectedSlice !== null && selectedSlice !== i && 'opacity-40'"
                @click="selectedSlice = selectedSlice === i ? null : i"
              >
                <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
                <span class="flex-1 truncate font-semibold text-ink">{{ s.label }}</span>
                <span class="font-bold text-muted">{{ Math.round((s.value / d.expense.value) * 100) }}%</span>
              </li>
            </ul>
          </div>
          <p v-else class="mt-3 text-[13px] text-muted">Belum ada pengeluaran di periode ini.</p>

          <div class="mt-5 border-t border-line pt-4">
            <div class="mb-4 flex items-center justify-between">
              <p class="text-[13px] font-bold text-ink">Tren pengeluaran</p>
              <div class="flex rounded-full bg-bg p-0.5 text-[12px] font-bold">
                <button class="rounded-full px-3 py-1 transition" :class="chartMode === 'week' ? 'bg-white text-primary shadow-card' : 'text-muted'" @click="chartMode = 'week'">7 Hari</button>
                <button class="rounded-full px-3 py-1 transition" :class="chartMode === 'month' ? 'bg-white text-primary shadow-card' : 'text-muted'" @click="chartMode = 'month'">Per Minggu</button>
              </div>
            </div>
            <BarChart :bars="chartMode === 'week' ? d.last7Days.value : d.weekly.value" />
          </div>
        </section>

        <!-- ===== Insight ===== -->
        <section v-if="d.insights.value.length" class="space-y-2">
          <h3 class="section-title m-0 mb-3">Insight</h3>
          <div
            v-for="(it, i) in d.insights.value"
            :key="i"
            class="flex items-center gap-3 rounded-2xl p-3"
            :class="{ info: 'bg-primary-light text-primary', good: 'bg-income/10 text-income', bad: 'bg-expense/10 text-expense' }[it.tone]"
          >
            <Icon :name="it.icon" size="20" class="shrink-0" />
            <p class="text-[13px] font-semibold text-ink">{{ it.text }}</p>
          </div>
        </section>

        <!-- ===== Pengingat backup ===== -->
        <NuxtLink v-if="showBackupReminder" to="/tabs/more" class="tap flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-3">
          <Icon name="lucide:database" size="20" class="shrink-0 text-warn" />
          <p class="flex-1 text-[13px] text-ink">
            <b>Data hanya tersimpan di HP ini.</b>
            {{ store.lastBackupAt ? `Backup terakhir ${dayjs(store.lastBackupAt).format('D MMM')}.` : 'Kamu belum pernah backup.' }}
          </p>
          <Icon name="lucide:chevron-right" size="18" class="text-muted" />
        </NuxtLink>

        <!-- ===== Transaksi terakhir ===== -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="section-title m-0">Transaksi terakhir</h3>
            <NuxtLink to="/tabs/transactions" class="text-[13px] font-bold text-primary">Lihat semua</NuxtLink>
          </div>

          <div v-if="d.loading.value" class="card space-y-4 p-4">
            <div v-for="i in 3" :key="i" class="flex animate-pulse items-center gap-3">
              <div class="size-10 rounded-2xl bg-primary-light" />
              <div class="flex-1 space-y-2"><div class="h-3 w-1/2 rounded bg-primary-light" /><div class="h-2.5 w-1/3 rounded bg-primary-light" /></div>
            </div>
          </div>
          <div v-else-if="recentGroups.length" class="card overflow-hidden py-1">
            <template v-for="g in recentGroups" :key="g.key">
              <p class="px-4 pt-3 pb-1 text-[11px] font-bold tracking-wide text-muted uppercase">{{ g.label }}</p>
              <TxItem
                v-for="t in g.items"
                :key="t.id"
                :tx="t"
                :category-map="d.categoryMap.value"
                :wallet-map="d.walletMap.value"
                @open="store.openTx(t.type, t.id)"
              />
            </template>
          </div>
          <div v-else class="card">
            <EmptyState
              title="Belum ada transaksi"
              text="Yuk catat transaksi pertamamu, cuma butuh beberapa detik!"
              action="Catat sekarang"
              @action="store.openTx('expense')"
            />
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>
