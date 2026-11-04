import { alertController, toastController } from '@ionic/vue'

export function useUi() {
  async function toast(message: string, color: 'dark' | 'danger' | 'primary' = 'dark') {
    const t = await toastController.create({ message, duration: 1800, position: 'top', color })
    await t.present()
  }

  async function confirm(header: string, message: string, okText = 'Hapus', destructive = true): Promise<boolean> {
    const a = await alertController.create({
      header,
      message,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        { text: okText, role: destructive ? 'destructive' : 'confirm' },
      ],
    })
    await a.present()
    const { role } = await a.onDidDismiss()
    return role === 'destructive' || role === 'confirm'
  }

  /** Prompt angka (Rupiah). Mengembalikan null bila dibatalkan. */
  async function promptAmount(header: string, current = 0, message?: string): Promise<number | null> {
    const a = await alertController.create({
      header,
      message,
      inputs: [{ name: 'v', type: 'number', placeholder: 'Contoh: 1500000', value: current || '', attributes: { inputmode: 'numeric', min: 0 } }],
      buttons: [{ text: 'Batal', role: 'cancel' }, { text: 'Simpan', role: 'confirm' }],
    })
    await a.present()
    const { role, data } = await a.onDidDismiss()
    if (role !== 'confirm') return null
    const n = Math.round(Number(data?.values?.v ?? 0))
    return Number.isFinite(n) && n >= 0 ? n : null
  }

  return { toast, confirm, promptAmount }
}
