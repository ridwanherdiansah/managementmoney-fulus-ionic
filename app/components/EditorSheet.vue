<script setup lang="ts">
import { PALETTE } from '~/constants/icons'
import type { EditorValue } from '~/types/editor'


const props = defineProps<{
  title: string
  icons: readonly string[]
  showAmount?: boolean
  amountLabel?: string
  showType?: boolean
  canDelete?: boolean
}>()
const emit = defineEmits<{ save: [EditorValue]; delete: [] }>()
const open = defineModel<boolean>('open', { required: true })
const initial = defineModel<EditorValue>('value', { required: true })

const form = reactive<EditorValue>({ name: '', icon: '', color: '' })
const amountText = ref('')

watch(open, (v) => {
  if (!v) return
  Object.assign(form, initial.value)
  amountText.value = initial.value.amount ? thousands(initial.value.amount) : ''
})

function onAmount(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 13)
  amountText.value = digits ? thousands(Number(digits)) : ''
}

function submit() {
  if (!form.name.trim()) return
  emit('save', {
    ...form,
    name: form.name.trim(),
    amount: props.showAmount ? Number(amountText.value.replace(/\D/g, '') || 0) : undefined,
  })
}
</script>

<template>
  <ion-modal class="sheet" :is-open="open" :initial-breakpoint="1" :breakpoints="[0, 1]" @did-dismiss="open = false">
    <div class="ion-page">
      <ion-content>
        <div class="px-5 pt-6 pb-8">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="m-0 text-lg font-extrabold text-ink">{{ title }}</h2>
            <button class="tap grid size-9 place-items-center rounded-full bg-white text-muted shadow-card" aria-label="Tutup" @click="open = false">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>

          <!-- Preview -->
          <div class="mb-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <CategoryBadge :icon="form.icon" :color="form.color" :size="52" />
            <div class="min-w-0">
              <p class="truncate text-[16px] font-bold text-ink">{{ form.name || 'Nama…' }}</p>
              <p v-if="showType" class="text-[12px] text-muted">{{ form.type === 'income' ? 'Pemasukan' : 'Pengeluaran' }}</p>
            </div>
          </div>

          <label class="label" for="ed-name">Nama</label>
          <input id="ed-name" v-model="form.name" class="input" maxlength="30" placeholder="Contoh: Belanja Dapur">

          <template v-if="showType">
            <p class="label mt-4">Tipe</p>
            <div class="grid grid-cols-2 gap-1 rounded-2xl bg-primary-light p-1">
              <button
                v-for="t in (['expense', 'income'] as const)"
                :key="t"
                class="rounded-xl py-2.5 text-[13px] font-bold transition"
                :class="form.type === t ? 'bg-white text-primary shadow-card' : 'text-muted'"
                @click="form.type = t"
              >
                {{ t === 'income' ? 'Pemasukan' : 'Pengeluaran' }}
              </button>
            </div>
          </template>

          <template v-if="showAmount">
            <label class="label mt-4" for="ed-amount">{{ amountLabel ?? 'Saldo awal' }}</label>
            <div class="relative">
              <span class="absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-bold text-muted">Rp</span>
              <input id="ed-amount" :value="amountText" class="input pl-11 font-bold tabular" inputmode="numeric" placeholder="0" @input="onAmount">
            </div>
          </template>

          <p class="label mt-4">Icon</p>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="ic in icons"
              :key="ic"
              class="tap grid aspect-square place-items-center rounded-xl border-2 bg-white transition"
              :class="form.icon === ic ? 'border-primary' : 'border-transparent'"
              :style="{ color: form.color }"
              @click="form.icon = ic"
            >
              <Icon :name="ic" size="24" />
            </button>
          </div>

          <p class="label mt-4">Warna</p>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="c in PALETTE"
              :key="c"
              class="tap grid aspect-square place-items-center rounded-full text-white ring-offset-2 ring-offset-bg transition"
              :class="form.color === c && 'ring-2 ring-ink'"
              :style="{ backgroundColor: c }"
              :aria-label="c"
              @click="form.color = c"
            >
              <Icon v-if="form.color === c" name="lucide:check" size="16" />
            </button>
          </div>

          <button class="btn-primary mt-6" :disabled="!form.name.trim()" @click="submit">Simpan</button>
          <button v-if="canDelete" class="tap mt-2 w-full py-3 text-[14px] font-bold text-expense" @click="emit('delete')">
            Hapus
          </button>
        </div>
      </ion-content>
    </div>
  </ion-modal>
</template>
