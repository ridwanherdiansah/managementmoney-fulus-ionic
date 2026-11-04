export interface EditorValue {
  name: string
  icon: string
  color: string
  /** saldo awal (dompet) */
  amount?: number
  /** tipe (kategori) */
  type?: 'expense' | 'income'
}
