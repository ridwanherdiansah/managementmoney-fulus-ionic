import { db, type Book, type Budget, type Category, type Transaction, type Wallet } from '~/db'
import { useAppStore } from '~/stores/app'
import type { Period } from '~/utils/format'

/** Semua buku (untuk switcher & halaman kelola buku) */
export function useBooks() {
  return useLive<Book[]>(() => db.books.orderBy('createdAt').toArray(), () => null, [])
}

interface BookData {
  book: Book | undefined
  wallets: Wallet[]
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
}

const EMPTY: BookData = { book: undefined, wallets: [], categories: [], budgets: [], transactions: [] }

/**
 * Data lengkap buku aktif + turunan yang sering dipakai.
 * Ribuan transaksi masih ringan dihitung di memori.
 */
export function useBook() {
  const store = useAppStore()

  const { data, loading } = useLive<BookData>(async () => {
    const bookId = store.activeBookId
    if (!bookId) return EMPTY
    const [book, wallets, categories, budgets, transactions] = await Promise.all([
      db.books.get(bookId),
      db.wallets.where('bookId').equals(bookId).sortBy('createdAt'),
      db.categories.where('bookId').equals(bookId).sortBy('order'),
      db.budgets.where('bookId').equals(bookId).toArray(),
      db.transactions.where('[bookId+date]').between([bookId, -Infinity], [bookId, Infinity]).reverse().toArray(),
    ])
    return { book, wallets, categories, budgets, transactions }
  }, () => store.activeBookId, EMPTY)

  const book = computed(() => data.value.book)
  const wallets = computed(() => data.value.wallets)
  const categories = computed(() => data.value.categories)
  const budgets = computed(() => data.value.budgets)
  const transactions = computed(() => data.value.transactions)

  const categoryMap = computed(() => new Map(categories.value.map(c => [c.id, c])))
  const walletMap = computed(() => new Map(wallets.value.map(w => [w.id, w])))

  /** Saldo setiap dompet sepanjang waktu */
  const walletBalances = computed(() => {
    const bal = new Map(wallets.value.map(w => [w.id, w.initialBalance]))
    for (const t of transactions.value) {
      if (t.type === 'income') bal.set(t.walletId, (bal.get(t.walletId) ?? 0) + t.amount)
      else if (t.type === 'expense') bal.set(t.walletId, (bal.get(t.walletId) ?? 0) - t.amount)
      else {
        bal.set(t.walletId, (bal.get(t.walletId) ?? 0) - t.amount)
        if (t.toWalletId) bal.set(t.toWalletId, (bal.get(t.toWalletId) ?? 0) + t.amount)
      }
    }
    return bal
  })

  const totalBalance = computed(() => [...walletBalances.value.values()].reduce((a, b) => a + b, 0))

  const period = computed(() => getPeriod(store.periodOffset, store.periodStartDay))
  const prevPeriod = computed(() => getPeriod(store.periodOffset - 1, store.periodStartDay))

  const inRange = (t: Transaction, p: Period) => t.date >= p.start && t.date < p.end
  const periodTxs = computed(() => transactions.value.filter(t => inRange(t, period.value)))
  const prevPeriodTxs = computed(() => transactions.value.filter(t => inRange(t, prevPeriod.value)))

  return {
    loading, book, wallets, categories, budgets, transactions,
    categoryMap, walletMap, walletBalances, totalBalance,
    period, prevPeriod, periodTxs, prevPeriodTxs,
  }
}

export function sumBy(txs: Transaction[], type: 'income' | 'expense') {
  let s = 0
  for (const t of txs) if (t.type === type) s += t.amount
  return s
}

export function expenseByCategory(txs: Transaction[]) {
  const m = new Map<string, number>()
  for (const t of txs) if (t.type === 'expense' && t.categoryId) m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.amount)
  return m
}

/** Kelompokkan transaksi per hari (input sudah urut terbaru dulu) */
export function groupByDay(txs: Transaction[]) {
  const groups: Array<{ key: number; label: string; items: Transaction[]; income: number; expense: number }> = []
  for (const t of txs) {
    const key = dayjs(t.date).startOf('day').valueOf()
    let g = groups[groups.length - 1]
    if (!g || g.key !== key) {
      g = { key, label: dayLabel(t.date), items: [], income: 0, expense: 0 }
      groups.push(g)
    }
    g.items.push(t)
    if (t.type === 'income') g.income += t.amount
    if (t.type === 'expense') g.expense += t.amount
  }
  return groups
}
