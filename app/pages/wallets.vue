<script setup lang="ts">
import { WALLET_ICONS } from '~/constants/icons'
import type { Wallet } from '~/db'
import { deleteWallet, saveWallet } from '~/db/repo'
import { useAppStore } from '~/stores/app'
import type { EditorValue } from '~/types/editor'

const store = useAppStore()
const { wallets, walletBalances, totalBalance } = useBook()
const { toast, confirm } = useUi()

const open = ref(false)
const editing = ref<Wallet | null>(null)
const value = ref<EditorValue>({ name: '', icon: WALLET_ICONS[0], color: '#1E5EFF', amount: 0 })

function add() {
  editing.value = null
  value.value = { name: '', icon: WALLET_ICONS[0], color: '#1E5EFF', amount: 0 }
  open.value = true
}

function edit(w: Wallet) {
  editing.value = w
  value.value = { name: w.name, icon: w.icon, color: w.color, amount: w.initialBalance }
  open.value = true
}

async function onSave(v: EditorValue) {
  if (!store.activeBookId) return
  await saveWallet({
    id: editing.value?.id, bookId: store.activeBookId,
    name: v.name, icon: v.icon, color: v.color, initialBalance: v.amount ?? 0,
  })
  open.value = false
  toast('Dompet disimpan', 'primary')
}

async function onDelete() {
  const w = editing.value
  if (!w) return
  if (wallets.value.length <= 1) return toast('Minimal harus ada 1 dompet', 'danger')
  if (!(await confirm('Hapus dompet?', `Dompet "${w.name}" akan dihapus.`))) return
  if (!(await deleteWallet(w.id))) return toast('Dompet sudah dipakai transaksi, tidak bisa dihapus', 'danger')
  open.value = false
  toast('Dompet dihapus')
}
</script>

<template>
  <ion-page>
    <SubHeader title="Dompet" action="Tambah" @action="add" />
    <ion-content>
      <div class="space-y-4 px-5 pt-2 pb-10">
        <div class="rounded-3xl bg-gradient-to-br from-[#2B6BFF] to-primary-dark p-5 text-white shadow-fab">
          <p class="text-[13px] text-white/75">Total semua dompet</p>
          <Money :value="totalBalance" class="block text-[28px] font-extrabold" />
          <p class="mt-1 text-[12px] text-white/75">{{ wallets.length }} dompet</p>
        </div>

        <div class="card divide-y divide-line">
          <button v-for="w in wallets" :key="w.id" class="tap flex w-full items-center gap-3 p-4 text-left" @click="edit(w)">
            <CategoryBadge :icon="w.icon" :color="w.color" :size="44" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[15px] font-bold text-ink">{{ w.name }}</p>
              <p class="text-[12px] text-muted">Saldo awal <Money :value="w.initialBalance" /></p>
            </div>
            <Money :value="walletBalances.get(w.id) ?? 0" class="text-[15px] font-extrabold text-ink" />
          </button>
        </div>
        <p class="px-1 text-[12px] text-muted">Saldo dihitung dari saldo awal + semua transaksi. Dompet yang sudah dipakai tidak bisa dihapus.</p>
      </div>
    </ion-content>

    <EditorSheet
      v-model:open="open"
      v-model:value="value"
      :title="editing ? 'Edit Dompet' : 'Dompet Baru'"
      :icons="WALLET_ICONS"
      show-amount
      :can-delete="!!editing"
      @save="onSave"
      @delete="onDelete"
    />
  </ion-page>
</template>
