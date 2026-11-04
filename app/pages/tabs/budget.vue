<script setup lang="ts">
import type { Category } from '~/db'
import { setBudget } from '~/db/repo'
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const d = useDashboard()
const { promptAmount, toast } = useUi()

const pct = computed(() => (d.budgetTotal.value ? (d.budgetSpent.value / d.budgetTotal.value) * 100 : 0))
const remaining = computed(() => d.budgetTotal.value - d.budgetSpent.value)

const unbudgeted = computed(() => {
  const has = new Set(d.budgets.value.map(x => x.categoryId))
  const spent = expenseByCategory(d.periodTxs.value)
  return d.categories.value
    .filter(c => c.type === 'expense' && !has.has(c.id))
    .map(c => ({ category: c, spent: spent.get(c.id) ?? 0 }))
    .sort((a, z) => z.spent - a.spent)
})

const counts = computed(() => ({
  safe: d.budgetRows.value.filter(r => r.state === 'safe').length,
  warn: d.budgetRows.value.filter(r => r.state === 'warn').length,
  over: d.budgetRows.value.filter(r => r.state === 'over').length,
}))

async function edit(c: Category, current = 0) {
  const v = await promptAmount(`Budget ${c.name}`, current, 'Budget berlaku setiap periode. Isi 0 untuk menghapus.')
  if (v === null || !store.activeBookId) return
  await setBudget(store.activeBookId, c.id, v)
  toast(v > 0 ? 'Budget disimpan' : 'Budget dihapus', 'primary')
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="flex items-center justify-between px-5 pt-2 pb-3">
          <h1 class="m-0 text-[22px] font-extrabold text-ink">Budget</h1>
          <PeriodPicker :label="d.period.value.label" />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="space-y-5 px-5 pt-1 pb-28">
        <!-- Ringkasan -->
        <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2B6BFF] to-primary-dark p-5 text-white shadow-fab">
          <div class="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10" />
          <template v-if="d.budgetRows.value.length">
            <p class="text-[13px] text-white/75">{{ remaining >= 0 ? 'Sisa budget' : 'Melebihi budget' }}</p>
            <Money :value="Math.abs(remaining)" class="block text-[30px] font-extrabold" />
            <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div class="h-full rounded-full transition-[width] duration-700" :class="pct > 100 ? 'bg-[#FF8A8D]' : pct >= 80 ? 'bg-warn' : 'bg-white'" :style="{ width: `${Math.min(100, pct)}%` }" />
            </div>
            <div class="mt-2 flex justify-between text-[12px] text-white/80">
              <span>Terpakai <Money :value="d.budgetSpent.value" class="font-bold text-white" /></span>
              <span>dari <Money :value="d.budgetTotal.value" class="font-bold text-white" /></span>
            </div>
            <div v-if="d.perDayLeft.value !== null" class="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-3 text-[13px]">
              <Icon name="lucide:sparkles" size="18" />
              <span>Jatah harian <Money :value="d.perDayLeft.value" class="font-extrabold" /> untuk {{ d.daysLeft.value }} hari lagi</span>
            </div>
          </template>
          <template v-else>
            <Icon name="solar:pie-chart-2-bold-duotone" size="36" />
            <p class="mt-2 text-[17px] font-extrabold">Belum ada budget</p>
            <p class="mt-1 text-[13px] text-white/80">Pilih kategori di bawah lalu tentukan batas pengeluaran bulanannya.</p>
          </template>
        </section>

        <!-- Status -->
        <div v-if="d.budgetRows.value.length" class="grid grid-cols-3 gap-3 text-center">
          <div class="card p-3"><p class="text-[20px] font-extrabold text-primary">{{ counts.safe }}</p><p class="text-[11px] font-semibold text-muted">Aman</p></div>
          <div class="card p-3"><p class="text-[20px] font-extrabold text-warn">{{ counts.warn }}</p><p class="text-[11px] font-semibold text-muted">Hampir habis</p></div>
          <div class="card p-3"><p class="text-[20px] font-extrabold text-expense">{{ counts.over }}</p><p class="text-[11px] font-semibold text-muted">Over</p></div>
        </div>

        <!-- Kategori dengan budget -->
        <section v-if="d.budgetRows.value.length">
          <h3 class="section-title m-0 mb-3">Kategori ber-budget</h3>
          <div class="card divide-y divide-line">
            <button v-for="r in d.budgetRows.value" :key="r.category.id" class="tap block w-full p-4 text-left" @click="edit(r.category, r.budget)">
              <div class="flex items-center gap-3">
                <CategoryBadge :icon="r.category.icon" :color="r.category.color" :size="40" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <span class="truncate text-[14px] font-bold text-ink">{{ r.category.name }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      :class="{ safe: 'bg-primary-light text-primary', warn: 'bg-warn/15 text-warn', over: 'bg-expense/10 text-expense' }[r.state]"
                    >{{ Math.round(r.pct) }}%</span>
                  </div>
                  <p class="text-[12px] text-muted">
                    <Money :value="r.spent" /> dari <Money :value="r.budget" />
                  </p>
                </div>
              </div>
              <ProgressBar :pct="r.pct" class="mt-3" />
              <p class="mt-1.5 text-right text-[11px] font-semibold" :class="r.state === 'over' ? 'text-expense' : 'text-muted'">
                {{ r.state === 'over' ? 'Lebih' : 'Sisa' }} <Money :value="Math.abs(r.budget - r.spent)" />
              </p>
            </button>
          </div>
        </section>

        <!-- Kategori tanpa budget -->
        <section v-if="unbudgeted.length">
          <h3 class="section-title m-0 mb-3">Belum ada budget</h3>
          <div class="card divide-y divide-line">
            <button v-for="u in unbudgeted" :key="u.category.id" class="tap flex w-full items-center gap-3 p-3.5 text-left" @click="edit(u.category)">
              <CategoryBadge :icon="u.category.icon" :color="u.category.color" :size="38" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[14px] font-semibold text-ink">{{ u.category.name }}</p>
                <p v-if="u.spent" class="text-[12px] text-muted">Terpakai <Money :value="u.spent" /></p>
              </div>
              <span class="flex items-center gap-1 rounded-full bg-primary-light px-3 py-1.5 text-[12px] font-bold text-primary">
                <Icon name="lucide:plus" size="14" /> Atur
              </span>
            </button>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>
