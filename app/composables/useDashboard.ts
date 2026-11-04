import type { Category } from '~/db'
import { useAppStore } from '~/stores/app'

export type BudgetState = 'safe' | 'warn' | 'over'

export interface BudgetRow {
  category: Category
  budget: number
  spent: number
  pct: number
  state: BudgetState
}

export function budgetState(pct: number): BudgetState {
  if (pct > 100) return 'over'
  if (pct >= 80) return 'warn'
  return 'safe'
}

export interface Insight {
  icon: string
  tone: 'info' | 'good' | 'bad'
  text: string
}

export function useDashboard() {
  const store = useAppStore()
  const b = useBook()

  const income = computed(() => sumBy(b.periodTxs.value, 'income'))
  const expense = computed(() => sumBy(b.periodTxs.value, 'expense'))
  const net = computed(() => income.value - expense.value)
  const prevExpense = computed(() => sumBy(b.prevPeriodTxs.value, 'expense'))
  const expenseChangePct = computed(() =>
    prevExpense.value > 0 ? ((expense.value - prevExpense.value) / prevExpense.value) * 100 : null,
  )

  const byCategory = computed(() => expenseByCategory(b.periodTxs.value))

  /** Untuk donut chart: kategori pengeluaran terbesar (maks 5 + "Lainnya") */
  const categorySlices = computed(() => {
    const rows = [...byCategory.value.entries()]
      .map(([id, value]) => ({ category: b.categoryMap.value.get(id), value }))
      .filter(r => r.category)
      .sort((a, z) => z.value - a.value)
    const top = rows.slice(0, 5).map(r => ({ label: r.category!.name, color: r.category!.color, icon: r.category!.icon, value: r.value }))
    const rest = rows.slice(5).reduce((s, r) => s + r.value, 0)
    if (rest > 0) top.push({ label: 'Lainnya', color: '#CBD5E1', icon: 'solar:menu-dots-bold-duotone', value: rest })
    return top
  })

  // ---------- Budget ----------
  const budgetRows = computed<BudgetRow[]>(() =>
    b.budgets.value
      .map((bg) => {
        const category = b.categoryMap.value.get(bg.categoryId)
        if (!category) return null
        const spent = byCategory.value.get(bg.categoryId) ?? 0
        const pct = bg.amount > 0 ? (spent / bg.amount) * 100 : 0
        return { category, budget: bg.amount, spent, pct, state: budgetState(pct) }
      })
      .filter((r): r is BudgetRow => !!r)
      .sort((a, z) => z.pct - a.pct),
  )

  const budgetTotal = computed(() => budgetRows.value.reduce((s, r) => s + r.budget, 0))
  const budgetSpent = computed(() => budgetRows.value.reduce((s, r) => s + r.spent, 0))

  /** Sisa hari di periode (termasuk hari ini). Null jika bukan periode berjalan. */
  const daysLeft = computed(() => {
    if (store.periodOffset !== 0) return null
    const today = dayjs().startOf('day').valueOf()
    return Math.max(1, Math.round((b.period.value.end - today) / 86_400_000))
  })
  const perDayLeft = computed(() =>
    daysLeft.value ? Math.max(0, budgetTotal.value - budgetSpent.value) / daysLeft.value : null,
  )

  // ---------- Grafik batang ----------
  /** 7 hari terakhir (berakhir hari ini atau akhir periode yang dilihat) */
  const last7Days = computed(() => {
    const endDay = store.periodOffset === 0
      ? dayjs().startOf('day')
      : dayjs(b.period.value.end).subtract(1, 'day').startOf('day')
    const days = Array.from({ length: 7 }, (_, i) => endDay.subtract(6 - i, 'day'))
    const map = new Map(days.map(d => [d.valueOf(), 0]))
    for (const t of b.transactions.value) {
      if (t.type !== 'expense') continue
      const k = dayjs(t.date).startOf('day').valueOf()
      if (map.has(k)) map.set(k, map.get(k)! + t.amount)
    }
    return days.map(d => ({
      label: d.format('dd'),
      value: map.get(d.valueOf()) ?? 0,
      highlight: d.isSame(dayjs(), 'day'),
    }))
  })

  /** Pengeluaran per minggu dalam periode */
  const weekly = computed(() => {
    const p = b.period.value
    const weeks = Math.ceil(p.days / 7)
    const sums = Array<number>(weeks).fill(0)
    for (const t of b.periodTxs.value) {
      if (t.type !== 'expense') continue
      sums[Math.min(weeks - 1, Math.floor((t.date - p.start) / (7 * 86_400_000)))]! += t.amount
    }
    const now = Date.now()
    return sums.map((value, i) => ({
      label: `Mg ${i + 1}`,
      value,
      highlight: now >= p.start + i * 7 * 86_400_000 && now < p.start + (i + 1) * 7 * 86_400_000,
    }))
  })

  // ---------- Insight otomatis (berbasis aturan) ----------
  const insights = computed<Insight[]>(() => {
    const out: Insight[] = []
    const txs = b.periodTxs.value.filter(t => t.type === 'expense')
    if (!txs.length) return out

    // Rata-rata harian
    const elapsed = store.periodOffset === 0
      ? Math.max(1, dayjs().startOf('day').diff(dayjs(b.period.value.start), 'day') + 1)
      : b.period.value.days
    out.push({
      icon: 'lucide:calendar',
      tone: 'info',
      text: `Rata-rata pengeluaran harian ${rupiah(expense.value / elapsed)}`,
    })

    // Kategori dengan kenaikan terbesar vs periode lalu
    const prev = expenseByCategory(b.prevPeriodTxs.value)
    let worst: { name: string; pct: number } | null = null
    for (const [id, val] of byCategory.value) {
      const p = prev.get(id)
      if (!p || p < 1) continue
      const pct = ((val - p) / p) * 100
      if (pct >= 20 && (!worst || pct > worst.pct)) worst = { name: b.categoryMap.value.get(id)?.name ?? '', pct }
    }
    if (worst) out.push({ icon: 'lucide:trending-up', tone: 'bad', text: `Pengeluaran ${worst.name} naik ${Math.round(worst.pct)}% dari periode lalu` })

    // Hari paling boros
    const byWeekday = Array<number>(7).fill(0)
    for (const t of txs) byWeekday[dayjs(t.date).day()]! += t.amount
    const maxIdx = byWeekday.indexOf(Math.max(...byWeekday))
    if (txs.length >= 5) out.push({ icon: 'lucide:lightbulb', tone: 'info', text: `Hari paling boros: ${dayjs().day(maxIdx).format('dddd')}` })

    // Budget jebol
    const over = budgetRows.value.filter(r => r.state === 'over')
    if (over.length) out.push({ icon: 'lucide:triangle-alert', tone: 'bad', text: `${over.length} kategori melebihi budget: ${over.map(r => r.category.name).join(', ')}` })
    else if (budgetRows.value.length && expenseChangePct.value !== null && expenseChangePct.value < 0) {
      out.push({ icon: 'lucide:circle-check', tone: 'good', text: `Mantap! Pengeluaran turun ${Math.round(-expenseChangePct.value)}% dari periode lalu` })
    }
    return out
  })

  return {
    ...b,
    income, expense, net, prevExpense, expenseChangePct,
    categorySlices, budgetRows, budgetTotal, budgetSpent, daysLeft, perDayLeft,
    last7Days, weekly, insights,
  }
}
