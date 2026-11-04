<script setup lang="ts">
import { CATEGORY_ICONS } from '~/constants/icons'
import type { Category, CategoryType } from '~/db'
import { deleteCategory, saveCategory } from '~/db/repo'
import { useAppStore } from '~/stores/app'
import type { EditorValue } from '~/types/editor'

const store = useAppStore()
const { categories } = useBook()
const { toast, confirm } = useUi()

const tab = ref<CategoryType>('expense')
const list = computed(() => categories.value.filter(c => c.type === tab.value))

const open = ref(false)
const editing = ref<Category | null>(null)
const value = ref<EditorValue>({ name: '', icon: CATEGORY_ICONS[0], color: '#1E5EFF', type: 'expense' })

function add() {
  editing.value = null
  value.value = { name: '', icon: CATEGORY_ICONS[0], color: '#1E5EFF', type: tab.value }
  open.value = true
}

function edit(c: Category) {
  editing.value = c
  value.value = { name: c.name, icon: c.icon, color: c.color, type: c.type }
  open.value = true
}

async function onSave(v: EditorValue) {
  if (!store.activeBookId) return
  await saveCategory({
    id: editing.value?.id, bookId: store.activeBookId,
    name: v.name, icon: v.icon, color: v.color, type: v.type ?? 'expense',
  })
  open.value = false
  toast('Kategori disimpan', 'primary')
}

async function onDelete() {
  const c = editing.value
  if (!c) return
  if (!(await confirm('Hapus kategori?', `Kategori "${c.name}" beserta budget-nya akan dihapus.`))) return
  if (!(await deleteCategory(c.id))) return toast('Kategori sudah dipakai transaksi, tidak bisa dihapus', 'danger')
  open.value = false
  toast('Kategori dihapus')
}
</script>

<template>
  <ion-page>
    <SubHeader title="Kategori" action="Tambah" @action="add" />
    <ion-content>
      <div class="px-5 pt-2 pb-10">
        <div class="grid grid-cols-2 gap-1 rounded-2xl bg-primary-light p-1">
          <button
            v-for="t in (['expense', 'income'] as const)"
            :key="t"
            class="rounded-xl py-2.5 text-[13px] font-bold transition"
            :class="tab === t ? 'bg-white text-primary shadow-card' : 'text-muted'"
            @click="tab = t"
          >
            {{ t === 'income' ? 'Pemasukan' : 'Pengeluaran' }}
          </button>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3">
          <button v-for="c in list" :key="c.id" class="tap card flex flex-col items-center gap-2 px-2 py-4" @click="edit(c)">
            <CategoryBadge :icon="c.icon" :color="c.color" :size="48" />
            <span class="line-clamp-2 text-center text-[12px] leading-tight font-semibold text-ink">{{ c.name }}</span>
          </button>
          <button class="tap flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 py-4 text-primary" @click="add">
            <Icon name="lucide:plus" size="24" />
            <span class="text-[12px] font-bold">Tambah</span>
          </button>
        </div>
      </div>
    </ion-content>

    <EditorSheet
      v-model:open="open"
      v-model:value="value"
      :title="editing ? 'Edit Kategori' : 'Kategori Baru'"
      :icons="CATEGORY_ICONS"
      show-type
      :can-delete="!!editing"
      @save="onSave"
      @delete="onDelete"
    />
  </ion-page>
</template>
