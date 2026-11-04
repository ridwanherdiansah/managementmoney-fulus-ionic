<script setup lang="ts">
import { BOOK_ICONS } from '~/constants/icons'
import { createBook } from '~/db/repo'
import { useAppStore } from '~/stores/app'
import type { EditorValue } from '~/types/editor'

const store = useAppStore()
const { data: books } = useBooks()
const { toast } = useUi()

const editorOpen = ref(false)
const editorValue = ref<EditorValue>({ name: '', icon: BOOK_ICONS[1], color: '#1E5EFF' })

function pick(id: string) {
  store.setActiveBook(id)
  store.bookSheetOpen = false
}

function newBook() {
  editorValue.value = { name: '', icon: BOOK_ICONS[1], color: '#1E5EFF' }
  editorOpen.value = true
}

async function onSave(v: EditorValue) {
  const id = await createBook({ name: v.name, icon: v.icon, color: v.color })
  editorOpen.value = false
  store.bookSheetOpen = false
  store.setActiveBook(id)
  toast(`Buku "${v.name}" dibuat`, 'primary')
}
</script>

<template>
  <ion-modal class="sheet" :is-open="store.bookSheetOpen" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.95]" @did-dismiss="store.bookSheetOpen = false">
    <div class="ion-page">
      <ion-content>
        <div class="px-5 pt-6 pb-8">
          <h2 class="m-0 text-lg font-extrabold text-ink">Pilih Buku</h2>
          <p class="mt-0.5 text-[13px] text-muted">Setiap buku punya transaksi, dompet & budget sendiri.</p>

          <div class="mt-4 space-y-2">
            <button
              v-for="b in books"
              :key="b.id"
              class="tap flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left shadow-card"
              :class="b.id === store.activeBookId ? 'border-primary' : 'border-transparent'"
              @click="pick(b.id)"
            >
              <CategoryBadge :icon="b.icon" :color="b.color" :size="44" />
              <span class="flex-1 text-[15px] font-bold text-ink">{{ b.name }}</span>
              <span v-if="b.id === store.activeBookId" class="grid size-6 place-items-center rounded-full bg-primary text-white">
                <Icon name="lucide:check" size="14" />
              </span>
            </button>
          </div>

          <button class="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 py-3.5 text-[14px] font-bold text-primary" @click="newBook">
            <Icon name="lucide:plus" size="18" /> Buat buku baru
          </button>
        </div>
      </ion-content>
    </div>

    <EditorSheet v-model:open="editorOpen" v-model:value="editorValue" title="Buku Baru" :icons="BOOK_ICONS" @save="onSave" />
  </ion-modal>
</template>
