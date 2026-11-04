import Dexie, { type EntityTable } from 'dexie'

export type TxType = 'expense' | 'income' | 'transfer'
export type CategoryType = 'expense' | 'income'

export interface Book {
  id: string
  name: string
  icon: string
  color: string
  createdAt: number
}

export interface Wallet {
  id: string
  bookId: string
  name: string
  icon: string
  color: string
  initialBalance: number
  createdAt: number
}

export interface Category {
  id: string
  bookId: string
  type: CategoryType
  name: string
  icon: string
  color: string
  order: number
}

export interface Transaction {
  id: string
  bookId: string
  type: TxType
  amount: number
  walletId: string
  /** hanya untuk transfer */
  toWalletId?: string
  /** kosong untuk transfer */
  categoryId?: string
  note: string
  /** timestamp (ms) tanggal transaksi */
  date: number
  createdAt: number
}

/** Budget bulanan per kategori (berlaku setiap periode) */
export interface Budget {
  id: string
  bookId: string
  categoryId: string
  amount: number
}

export const db = new Dexie('fulus') as Dexie & {
  books: EntityTable<Book, 'id'>
  wallets: EntityTable<Wallet, 'id'>
  categories: EntityTable<Category, 'id'>
  transactions: EntityTable<Transaction, 'id'>
  budgets: EntityTable<Budget, 'id'>
}

db.version(1).stores({
  books: 'id, createdAt',
  wallets: 'id, bookId',
  categories: 'id, bookId, [bookId+type]',
  transactions: 'id, bookId, [bookId+date], walletId, categoryId',
  budgets: 'id, bookId, [bookId+categoryId]',
})

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
