<script setup lang="ts">
import { db, type TxType } from '~/db'
import { deleteTransaction, saveTransaction } from '~/db/repo'
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const { categories, wallets, walletBalances } = useBook()
const { toast, confirm } = useUi()

const TYPES: Array<{ value: TxType; label: string; icon: string }> = [
  { value: 'expense', label: 'Keluar', icon: 'lucide:arrow-up-right' },
  { value: 'income', label: 'Masuk', icon: 'lucide:arrow-down-left' },
  { value: 'transfer', label: 'Transfer', icon: 'lucide:arrow-left-right' },
]

const form = reactive({
  type: 'expense' as TxType,
  digits: '',
  categoryId: '' as string,
  walletId: '' as string,
  toWalletId: '' as string,
  date: dayjs().format('YYYY-MM-DD'),
  note: '',
  originalDate: null as number | null,
})
const saving = ref(false)

const isEdit = computed(() => !!store.txSheet.editId)
const amount = computed(() => Number(form.digits || 0))
const typeCategories = computed(() => categories.value.filter(c => c.type === form.type))
const accent = computed(() => ({ expense: 'text-expense', income: 'text-income', transfer: 'text-primary' })[form.type])

async function reset() {
  const s = store.txSheet
  if (s.editId) {
    const t = await db.transactions.get(s.editId)
    if (t) {
      Object.assign(form, {
        type: t.type, digits: String(t.amount), categoryId: t.categoryId ?? '',
        walletId: t.walletId, toWalletId: t.toWalletId ?? '',
        date: dayjs(t.date).format('YYYY-MM-DD'), note: t.note, originalDate: t.date,
      })
      return
    }
  }
  Object.assign(form, {
    type: s.type, digits: '', categoryId: '', walletId: wallets.value[0]?.id ?? '',
    toWalletId: wallets.value[1]?.id ?? '', date: dayjs().format('YYYY-MM-DD'), note: '', originalDate: null,
  })
}

watch(() => store.txSheet.open, (open) => { if (open) reset() })

watch(() => form.type, () => {
  if (!typeCategories.value.some(c => c.id === form.categoryId)) form.categoryId = ''
})

function press(key: string) {
  if (key === 'del') form.digits = form.digits.slice(0, -1)
  else if (key === 'clear') form.digits = ''
  else if ((form.digits + key).length <= 13) form.digits = (form.digits + key).replace(/^0+/, '')
}

const error = computed(() => {
  if (amount.value <= 0) return 'Masukkan nominal'
  if (!form.walletId) return 'Pilih dompet'
  if (form.type !== 'transfer' && !form.categoryId) return 'Pilih kategori'
  if (form.type === 'transfer' && (!form.toWalletId || form.toWalletId === form.walletId)) return 'Pilih dompet tujuan yang berbeda'
  return null
})

function buildDate(): number {
  const day = dayjs(form.date)
  // Pertahankan jam asli saat edit di hari yang sama; transaksi hari ini pakai jam sekarang
  if (form.originalDate && dayjs(form.originalDate).isSame(day, 'day')) return form.originalDate
  if (day.isSame(dayjs(), 'day')) return Date.now()
  return day.hour(12).valueOf()
}

async function save() {
  if (error.value || !store.activeBookId) return
  saving.value = true
  try {
    await saveTransaction({
      id: store.txSheet.editId ?? undefined,
      bookId: store.activeBookId,
      type: form.type,
      amount: amount.value,
      walletId: form.walletId,
      toWalletId: form.type === 'transfer' ? form.toWalletId : undefined,
      categoryId: form.type !== 'transfer' ? form.categoryId : undefined,
      note: form.note.trim(),
      date: buildDate(),
    })
    store.closeTx()
    toast(isEdit.value ? 'Transaksi diperbarui' : 'Transaksi tersimpan ✓', 'primary')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!store.txSheet.editId) return
  if (!(await confirm('Hapus transaksi?', 'Transaksi ini akan dihapus permanen.'))) return
  await deleteTransaction(store.txSheet.editId)
  store.closeTx()
  toast('Transaksi dihapus')
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del']
</script>

<template>
  <ion-modal
    class="sheet"
    :is-open="store.txSheet.open"
    :initial-breakpoint="1"
    :breakpoints="[0, 1]"
    @did-dismiss="store.closeTx()"
  >
    <div class="ion-page">
      <ion-content :scroll-y="true">
        <div class="px-5 pt-6 pb-4">
          <!-- Header -->
          <div class="mb-4 flex items-center justify-between">
            <h2 class="m-0 text-lg font-extrabold text-ink">{{ isEdit ? 'Edit Transaksi' : 'Tambah Transaksi' }}</h2>
            <div class="flex gap-2">
              <button v-if="isEdit" class="tap grid size-9 place-items-center rounded-full bg-expense/10 text-expense" aria-label="Hapus" @click="remove">
                <Icon name="lucide:trash-2" size="18" />
              </button>
              <button class="tap grid size-9 place-items-center rounded-full bg-white text-muted shadow-card" aria-label="Tutup" @click="store.closeTx()">
                <Icon name="lucide:x" size="18" />
              </button>
            </div>
          </div>

          <!-- Tipe -->
          <div class="grid grid-cols-3 gap-1 rounded-2xl bg-primary-light p-1">
            <button
              v-for="t in TYPES"
              :key="t.value"
              class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition"
              :class="form.type === t.value ? 'bg-white text-primary shadow-card' : 'text-muted'"
              @click="form.type = t.value"
            >
              <Icon :name="t.icon" size="16" />{{ t.label }}
            </button>
          </div>

          <!-- Nominal -->
          <div class="py-5 text-center">
            <p class="text-[12px] font-semibold text-muted">Nominal</p>
            <p class="mt-1 text-[38px] leading-tight font-extrabold break-all tabular" :class="amount ? accent : 'text-muted/40'">
              <span class="mr-1 text-xl">Rp</span>{{ thousands(amount) }}
            </p>
          </div>

          <!-- Kategori -->
          <template v-if="form.type !== 'transfer'">
            <p class="label">Kategori</p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="c in typeCategories"
                :key="c.id"
                class="tap flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 transition"
                :class="form.categoryId === c.id ? 'border-primary bg-white shadow-card' : 'border-transparent'"
                @click="form.categoryId = c.id"
              >
                <CategoryBadge :icon="c.icon" :color="c.color" :size="40" />
                <span class="line-clamp-2 text-center text-[11px] leading-tight font-semibold text-ink">{{ c.name }}</span>
              </button>
            </div>
          </template>

          <!-- Dompet -->
          <p class="label mt-4">{{ form.type === 'income' ? 'Masuk ke dompet' : 'Dari dompet' }}</p>
          <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            <button
              v-for="w in wallets"
              :key="w.id"
              class="chip shrink-0"
              :class="form.walletId === w.id && 'chip-active'"
              @click="form.walletId = w.id"
            >
              <Icon :name="w.icon" size="16" />{{ w.name }}
            </button>
          </div>

          <template v-if="form.type === 'transfer'">
            <p class="label mt-4">Ke dompet</p>
            <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              <button
                v-for="w in wallets"
                :key="w.id"
                class="chip shrink-0 disabled:opacity-30"
                :class="form.toWalletId === w.id && 'chip-active'"
                :disabled="w.id === form.walletId"
                @click="form.toWalletId = w.id"
              >
                <Icon :name="w.icon" size="16" />{{ w.name }}
              </button>
            </div>
            <p v-if="form.walletId" class="mt-2 text-[12px] text-muted">
              Saldo asal: <Money :value="walletBalances.get(form.walletId) ?? 0" :maskable="false" class="font-semibold text-ink" />
            </p>
          </template>

          <!-- Tanggal & catatan -->
          <div class="mt-4 grid grid-cols-[auto_1fr] gap-2">
            <label class="relative flex items-center gap-2 rounded-xl border border-line bg-white px-3 text-[14px] font-semibold text-ink">
              <Icon name="lucide:calendar" size="16" class="text-primary" />
              <input v-model="form.date" type="date" :max="dayjs().add(1, 'year').format('YYYY-MM-DD')" class="w-[118px] bg-transparent py-3 outline-none">
            </label>
            <input v-model="form.note" class="input" placeholder="Catatan (opsional)" maxlength="80">
          </div>
        </div>
      </ion-content>

      <!-- Keypad -->
      <ion-footer class="ion-no-border">
        <div class="bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(30_94_255/0.2)]">
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="k in KEYS"
              :key="k"
              class="h-12 rounded-xl bg-bg text-xl font-bold text-ink transition active:scale-95 active:bg-primary-light"
              :aria-label="k === 'del' ? 'Hapus angka' : k"
              @click="press(k)"
              @contextmenu.prevent="k === 'del' && press('clear')"
            >
              <Icon v-if="k === 'del'" name="lucide:delete" size="22" class="mx-auto" />
              <template v-else>{{ k }}</template>
            </button>
          </div>
          <button class="btn-primary mt-3" :disabled="!!error || saving" @click="save">
            <Icon name="lucide:check" size="18" />
            {{ error ?? (isEdit ? 'Simpan Perubahan' : 'Simpan') }}
          </button>
        </div>
      </ion-footer>
    </div>
  </ion-modal>
</template>
