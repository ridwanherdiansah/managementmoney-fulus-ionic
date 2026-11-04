<script setup lang="ts">
import { exportAll, importAll } from '~/db/repo'
import { useAppStore } from '~/stores/app'

const store = useAppStore()
const { data: books } = useBooks()
const { toast, confirm } = useUi()
const fileInput = ref<HTMLInputElement>()

const name = ref(store.userName)
watch(name, (v) => {
  store.userName = v.trim()
  store.persist()
})

const startDay = computed({
  get: () => store.periodStartDay,
  set: (v: number) => {
    store.periodStartDay = v
    store.periodOffset = 0
    store.persist()
  },
})

const MENU = [
  { to: '/books', icon: 'solar:book-bold-duotone', color: '#1E5EFF', label: 'Kelola Buku', sub: () => `${books.value.length} buku` },
  { to: '/wallets', icon: 'solar:wallet-money-bold-duotone', color: '#16A34A', label: 'Dompet', sub: () => 'Tunai, rekening, e-wallet' },
  { to: '/categories', icon: 'solar:widget-5-bold-duotone', color: '#F97316', label: 'Kategori', sub: () => 'Atur kategori & icon' },
]

async function doExport() {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fulus-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`
  a.click()
  URL.revokeObjectURL(url)
  store.lastBackupAt = Date.now()
  store.persist()
  toast('Backup berhasil diunduh', 'primary')
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!(await confirm('Pulihkan data?', 'Semua data di HP ini akan DIGANTI dengan isi file backup.', 'Pulihkan'))) return
  try {
    const data = JSON.parse(await file.text())
    await importAll(data)
    const first = data.books[0]?.id
    if (first) store.setActiveBook(first)
    toast('Data berhasil dipulihkan', 'primary')
  } catch (err) {
    toast(err instanceof Error ? err.message : 'Gagal membaca file', 'danger')
  }
}
</script>

<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <h1 class="m-0 px-5 pt-2 pb-3 text-[22px] font-extrabold text-ink">Lainnya</h1>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="space-y-5 px-5 pt-1 pb-28">
        <!-- Profil -->
        <section class="card flex items-center gap-3 p-4">
          <div class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-lg font-extrabold text-white">
            {{ (store.userName || 'F').charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <label for="nm" class="text-[12px] font-semibold text-muted">Nama panggilan</label>
            <input id="nm" v-model="name" class="w-full bg-transparent text-[16px] font-bold text-ink outline-none placeholder:text-muted/50" placeholder="Ketik namamu…" maxlength="24">
          </div>
          <Icon name="lucide:pencil" size="16" class="text-muted" />
        </section>

        <!-- Menu -->
        <section class="card divide-y divide-line">
          <NuxtLink v-for="m in MENU" :key="m.to" :to="m.to" class="tap flex items-center gap-3 p-3.5">
            <CategoryBadge :icon="m.icon" :color="m.color" :size="40" rounded="rounded-xl" />
            <div class="flex-1">
              <p class="text-[14px] font-bold text-ink">{{ m.label }}</p>
              <p class="text-[12px] text-muted">{{ m.sub() }}</p>
            </div>
            <Icon name="lucide:chevron-right" size="18" class="text-muted" />
          </NuxtLink>
        </section>

        <!-- Pengaturan -->
        <section>
          <h3 class="section-title m-0 mb-3">Pengaturan</h3>
          <div class="card divide-y divide-line">
            <div class="flex items-center gap-3 p-3.5">
              <CategoryBadge icon="solar:case-bold-duotone" color="#8B5CF6" :size="40" rounded="rounded-xl" />
              <div class="flex-1">
                <p class="text-[14px] font-bold text-ink">Awal periode</p>
                <p class="text-[12px] text-muted">Mis. tanggal gajian</p>
              </div>
              <select v-model.number="startDay" class="rounded-xl border border-line bg-bg px-3 py-2 text-[14px] font-bold text-ink outline-none">
                <option v-for="i in 28" :key="i" :value="i">Tgl {{ i }}</option>
              </select>
            </div>
            <button class="tap flex w-full items-center gap-3 p-3.5 text-left" @click="store.toggleHideBalance()">
              <CategoryBadge :icon="store.hideBalance ? 'lucide:eye-off' : 'lucide:eye'" color="#0EA5E9" :size="40" rounded="rounded-xl" />
              <div class="flex-1">
                <p class="text-[14px] font-bold text-ink">Sembunyikan nominal</p>
                <p class="text-[12px] text-muted">Privasi saat di tempat umum</p>
              </div>
              <span class="relative h-7 w-12 rounded-full transition" :class="store.hideBalance ? 'bg-primary' : 'bg-line'">
                <span class="absolute top-1 size-5 rounded-full bg-white shadow transition-all" :class="store.hideBalance ? 'left-6' : 'left-1'" />
              </span>
            </button>
          </div>
        </section>

        <!-- Backup -->
        <section>
          <h3 class="section-title m-0 mb-1">Backup & pulihkan</h3>
          <p class="mb-3 text-[12px] text-muted">
            Data hanya tersimpan di perangkat ini.
            {{ store.lastBackupAt ? `Backup terakhir ${dayjs(store.lastBackupAt).format('D MMM YYYY, HH:mm')}.` : 'Belum pernah backup.' }}
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button class="tap card flex flex-col items-center gap-2 p-4" @click="doExport">
              <span class="grid size-11 place-items-center rounded-2xl bg-primary-light text-primary"><Icon name="lucide:download" size="22" /></span>
              <span class="text-[13px] font-bold text-ink">Backup data</span>
            </button>
            <button class="tap card flex flex-col items-center gap-2 p-4" @click="fileInput?.click()">
              <span class="grid size-11 place-items-center rounded-2xl bg-warn/10 text-warn"><Icon name="lucide:upload" size="22" /></span>
              <span class="text-[13px] font-bold text-ink">Pulihkan</span>
            </button>
          </div>
          <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onImport">
        </section>

        <p class="pt-2 text-center text-[12px] text-muted">Fulus · v0.1.0 · 100% offline</p>
      </div>
    </ion-content>
  </ion-page>
</template>
