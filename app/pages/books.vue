<script setup lang="ts">
import { BOOK_ICONS } from '~/constants/icons'
import { db, type Book } from '~/db'
import { createBook, deleteBook, updateBook } from '~/db/repo'
import { useAppStore } from '~/stores/app'
import type { EditorValue } from '~/types/editor'

const store = useAppStore()
const { data: books } = useBooks()
const { toast, confirm } = useUi()

// Jumlah transaksi per buku
const { data: counts } = useLive(async () => {
  const m = new Map<string, number>()
  await db.transactions.each(t => m.set(t.bookId, (m.get(t.bookId) ?? 0) + 1))
  return m
}, () => null, new Map<string, number>())

const open = ref(false)
const editing = ref<Book | null>(null)
const value = ref<EditorValue>({ name: '', icon: BOOK_ICONS[1], color: '#1E5EFF' })

function add() {
  editing.value = null
  value.value = { name: '', icon: BOOK_ICONS[1], color: '#1E5EFF' }
  open.value = true
}

function edit(b: Book) {
  editing.value = b
  value.value = { name: b.name, icon: b.icon, color: b.color }
  open.value = true
}

async function onSave(v: EditorValue) {
  const patch = { name: v.name, icon: v.icon, color: v.color }
  if (editing.value) await updateBook(editing.value.id, patch)
  else store.setActiveBook(await createBook(patch))
  open.value = false
  toast('Buku disimpan', 'primary')
}

async function onDelete() {
  const b = editing.value
  if (!b) return
  if (books.value.length <= 1) return toast('Minimal harus ada 1 buku', 'danger')
  const n = counts.value.get(b.id) ?? 0
  if (!(await confirm('Hapus buku?', `"${b.name}" beserta ${n} transaksi, dompet, kategori & budget-nya akan dihapus PERMANEN.`))) return
  await deleteBook(b.id)
  if (store.activeBookId === b.id) {
    const next = books.value.find(x => x.id !== b.id)
    if (next) store.setActiveBook(next.id)
  }
  open.value = false
  toast('Buku dihapus')
}
</script>

<template>
  <ion-page>
    <SubHeader title="Kelola Buku" action="Buku baru" @action="add" />
    <ion-content>
      <div class="space-y-3 px-5 pt-2 pb-10">
        <p class="px-1 text-[13px] text-muted">Pisahkan catatan keuangan, misalnya Rumah, Usaha, atau Pribadi. Tap buku untuk mengubah.</p>
        <div v-for="b in books" :key="b.id" class="card flex items-center gap-3 p-4">
          <CategoryBadge :icon="b.icon" :color="b.color" :size="48" />
          <button class="min-w-0 flex-1 text-left" @click="edit(b)">
            <p class="truncate text-[15px] font-bold text-ink">{{ b.name }}</p>
            <p class="text-[12px] text-muted">{{ counts.get(b.id) ?? 0 }} transaksi · dibuat {{ dayjs(b.createdAt).format('D MMM YYYY') }}</p>
          </button>
          <span v-if="b.id === store.activeBookId" class="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-bold text-primary">Aktif</span>
          <button v-else class="tap rounded-full border border-line px-3 py-1 text-[12px] font-bold text-ink" @click="store.setActiveBook(b.id)">Pakai</button>
        </div>
      </div>
    </ion-content>

    <EditorSheet
      v-model:open="open"
      v-model:value="value"
      :title="editing ? 'Edit Buku' : 'Buku Baru'"
      :icons="BOOK_ICONS"
      :can-delete="!!editing"
      @save="onSave"
      @delete="onDelete"
    />
  </ion-page>
</template>
