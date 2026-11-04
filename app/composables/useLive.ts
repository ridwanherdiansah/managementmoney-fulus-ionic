import { liveQuery, type Subscription } from 'dexie'
import type { WatchSource } from 'vue'

/**
 * Query Dexie yang reaktif: otomatis update saat data di IndexedDB berubah,
 * dan subscribe ulang saat `deps` (mis. buku aktif) berganti.
 */
export function useLive<T>(query: () => Promise<T>, deps: WatchSource | WatchSource[], initial: T) {
  const data = shallowRef<T>(initial)
  const loading = ref(true)
  let sub: Subscription | undefined

  watch(deps, () => {
    sub?.unsubscribe()
    loading.value = true
    sub = liveQuery(query).subscribe({
      next: (v) => {
        data.value = v
        loading.value = false
      },
      error: (e) => {
        console.error('[useLive]', e)
        loading.value = false
      },
    })
  }, { immediate: true })

  onScopeDispose(() => sub?.unsubscribe())
  return { data, loading }
}
