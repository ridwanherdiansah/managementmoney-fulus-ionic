// Semua akses data lewat file ini. Nanti kalau pindah ke SQLite / cloud,
// cukup ganti implementasi di sini.
import { db, uid, type Book, type Budget, type Category, type CategoryType, type Transaction, type Wallet } from './index'

const DEFAULT_CATEGORIES: Array<Pick<Category, 'type' | 'name' | 'icon' | 'color'>> = [
  { type: 'expense', name: 'Makan & Minum', icon: 'solar:cup-hot-bold-duotone', color: '#F97316' },
  { type: 'expense', name: 'Belanja Dapur', icon: 'solar:cart-large-2-bold-duotone', color: '#16A34A' },
  { type: 'expense', name: 'Listrik', icon: 'solar:bolt-bold-duotone', color: '#F59E0B' },
  { type: 'expense', name: 'Air', icon: 'solar:waterdrops-bold-duotone', color: '#0EA5E9' },
  { type: 'expense', name: 'Internet & Pulsa', icon: 'solar:wi-fi-router-bold-duotone', color: '#6366F1' },
  { type: 'expense', name: 'Transportasi', icon: 'solar:gas-station-bold-duotone', color: '#64748B' },
  { type: 'expense', name: 'Pendidikan', icon: 'solar:square-academic-cap-bold-duotone', color: '#1E5EFF' },
  { type: 'expense', name: 'Kesehatan', icon: 'solar:health-bold-duotone', color: '#E5484D' },
  { type: 'expense', name: 'Rumah Tangga', icon: 'solar:home-smile-bold-duotone', color: '#14B8A6' },
  { type: 'expense', name: 'Cicilan', icon: 'solar:card-transfer-bold-duotone', color: '#8B5CF6' },
  { type: 'expense', name: 'Sedekah', icon: 'solar:heart-bold-duotone', color: '#EC4899' },
  { type: 'expense', name: 'Hiburan', icon: 'solar:gamepad-bold-duotone', color: '#84CC16' },
  { type: 'expense', name: 'Lainnya', icon: 'solar:menu-dots-bold-duotone', color: '#64748B' },
  { type: 'income', name: 'Gaji', icon: 'solar:case-bold-duotone', color: '#16A34A' },
  { type: 'income', name: 'Usaha', icon: 'solar:shop-bold-duotone', color: '#1E5EFF' },
  { type: 'income', name: 'Bonus', icon: 'solar:star-bold-duotone', color: '#F59E0B' },
  { type: 'income', name: 'Hadiah', icon: 'solar:gift-bold-duotone', color: '#EC4899' },
  { type: 'income', name: 'Lainnya', icon: 'solar:hand-money-bold-duotone', color: '#64748B' },
]

// ---------- Buku ----------

export async function createBook(input: Pick<Book, 'name' | 'icon' | 'color'>): Promise<string> {
  const bookId = uid()
  const now = Date.now()
  await db.transaction('rw', [db.books, db.wallets, db.categories], async () => {
    await db.books.add({ id: bookId, ...input, createdAt: now })
    await db.wallets.add({
      id: uid(), bookId, name: 'Tunai', icon: 'solar:banknote-2-bold-duotone',
      color: '#16A34A', initialBalance: 0, createdAt: now,
    })
    await db.categories.bulkAdd(DEFAULT_CATEGORIES.map((c, i) => ({ id: uid(), bookId, order: i, ...c })))
  })
  return bookId
}

export const updateBook = (id: string, patch: Partial<Book>) => db.books.update(id, patch)

export async function deleteBook(id: string) {
  await db.transaction('rw', [db.books, db.wallets, db.categories, db.transactions, db.budgets], async () => {
    await db.transactions.where('bookId').equals(id).delete()
    await db.budgets.where('bookId').equals(id).delete()
    await db.categories.where('bookId').equals(id).delete()
    await db.wallets.where('bookId').equals(id).delete()
    await db.books.delete(id)
  })
}

// ---------- Dompet ----------

export async function saveWallet(w: Omit<Wallet, 'id' | 'createdAt'> & { id?: string }) {
  if (w.id) return db.wallets.update(w.id, w)
  return db.wallets.add({ ...w, id: uid(), createdAt: Date.now() })
}

/** Dompet yang sudah dipakai transaksi tidak boleh dihapus (menjaga riwayat). */
export async function deleteWallet(id: string): Promise<boolean> {
  const used = await db.transactions.filter(t => t.walletId === id || t.toWalletId === id).count()
  if (used > 0) return false
  await db.wallets.delete(id)
  return true
}

// ---------- Kategori ----------

export async function saveCategory(c: Omit<Category, 'id' | 'order'> & { id?: string }) {
  if (c.id) return db.categories.update(c.id, c)
  const count = await db.categories.where('bookId').equals(c.bookId).count()
  return db.categories.add({ ...c, id: uid(), order: count })
}

export async function deleteCategory(id: string): Promise<boolean> {
  const used = await db.transactions.where('categoryId').equals(id).count()
  if (used > 0) return false
  await db.transaction('rw', [db.categories, db.budgets], async () => {
    await db.budgets.filter(b => b.categoryId === id).delete()
    await db.categories.delete(id)
  })
  return true
}


// ---------- Transaksi ----------

export type TxInput = Omit<Transaction, 'id' | 'createdAt'> & { id?: string }

export async function saveTransaction(t: TxInput) {
  const data = { ...t }
  if (data.type === 'transfer') delete data.categoryId
  else delete data.toWalletId
  if (data.id) {
    const { id, ...rest } = data
    // replace penuh supaya field yang tidak relevan ikut terhapus
    const old = await db.transactions.get(id)
    if (old) return db.transactions.put({ ...rest, id, createdAt: old.createdAt } as Transaction)
  }
  return db.transactions.add({ ...data, id: uid(), createdAt: Date.now() } as Transaction)
}

export const deleteTransaction = (id: string) => db.transactions.delete(id)

// ---------- Budget ----------

export async function setBudget(bookId: string, categoryId: string, amount: number) {
  const existing = await db.budgets.where({ bookId, categoryId }).first()
  if (amount <= 0) {
    if (existing) await db.budgets.delete(existing.id)
    return
  }
  if (existing) await db.budgets.update(existing.id, { amount })
  else await db.budgets.add({ id: uid(), bookId, categoryId, amount } satisfies Budget)
}

// ---------- Backup ----------

export interface BackupFile {
  app: 'fulus'
  version: 1
  exportedAt: number
  books: Book[]
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
}

export async function exportAll(): Promise<BackupFile> {
  const [books, wallets, categories, transactions, budgets] = await Promise.all([
    db.books.toArray(), db.wallets.toArray(), db.categories.toArray(),
    db.transactions.toArray(), db.budgets.toArray(),
  ])
  return { app: 'fulus', version: 1, exportedAt: Date.now(), books, wallets, categories, transactions, budgets }
}

/** Mengganti seluruh data dengan isi backup. */
export async function importAll(data: BackupFile) {
  if (data?.app !== 'fulus' || !Array.isArray(data.books)) throw new Error('File backup tidak valid')
  await db.transaction('rw', [db.books, db.wallets, db.categories, db.transactions, db.budgets], async () => {
    await Promise.all([db.books.clear(), db.wallets.clear(), db.categories.clear(), db.transactions.clear(), db.budgets.clear()])
    await db.books.bulkAdd(data.books)
    await db.wallets.bulkAdd(data.wallets ?? [])
    await db.categories.bulkAdd(data.categories ?? [])
    await db.transactions.bulkAdd(data.transactions ?? [])
    await db.budgets.bulkAdd(data.budgets ?? [])
  })
}
