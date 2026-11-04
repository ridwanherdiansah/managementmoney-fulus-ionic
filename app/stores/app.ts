import { defineStore } from 'pinia'
import type { TxType } from '~/db'

const PREFS_KEY = 'fulus:prefs'

interface Prefs {
  activeBookId: string | null
  hideBalance: boolean
  userName: string
  periodStartDay: number
  lastBackupAt: number | null
}

function loadPrefs(): Partial<Prefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
  } catch {
    return {}
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    activeBookId: null as string | null,
    hideBalance: false,
    userName: '',
    periodStartDay: 1,
    lastBackupAt: null as number | null,
    ...loadPrefs(),

    /** offset periode yang sedang dilihat (0 = periode berjalan) */
    periodOffset: 0,

    // Sheet tambah/edit transaksi (global, dibuka dari mana saja)
    txSheet: { open: false, type: 'expense' as TxType, editId: null as string | null },
    bookSheetOpen: false,
  }),
  actions: {
    persist() {
      const { activeBookId, hideBalance, userName, periodStartDay, lastBackupAt } = this
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ activeBookId, hideBalance, userName, periodStartDay, lastBackupAt }))
      } catch { /* storage tidak tersedia */ }
    },
    setActiveBook(id: string) {
      this.activeBookId = id
      this.periodOffset = 0
      this.persist()
    },
    toggleHideBalance() {
      this.hideBalance = !this.hideBalance
      this.persist()
    },
    openTx(type: TxType = 'expense', editId: string | null = null) {
      this.txSheet = { open: true, type, editId }
    },
    closeTx() {
      this.txSheet.open = false
    },
  },
})
