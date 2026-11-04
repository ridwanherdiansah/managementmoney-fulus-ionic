import { db } from '~/db'
import { createBook } from '~/db/repo'
import { useAppStore } from '~/stores/app'

// Pastikan selalu ada minimal 1 buku & buku aktif valid sebelum app dirender
export default defineNuxtPlugin({
  name: 'fulus-init',
  dependsOn: ['pinia'],
  async setup() {
    const store = useAppStore()
    let books = await db.books.orderBy('createdAt').toArray()
    if (!books.length) {
      await createBook({ name: 'Keuangan Rumah', icon: 'solar:home-smile-bold-duotone', color: '#1E5EFF' })
      books = await db.books.toArray()
    }
    if (!books.some(b => b.id === store.activeBookId)) store.setActiveBook(books[0]!.id)
  },
})
