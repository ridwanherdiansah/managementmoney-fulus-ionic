// Semua icon yang namanya disimpan di database (dinamis) WAJIB ada di sini,
// karena di-bundle lewat `icon.clientBundle.icons` di nuxt.config.ts (offline).

export const CATEGORY_ICONS = [
  'solar:cart-large-2-bold-duotone',
  'solar:cup-hot-bold-duotone',
  'solar:chef-hat-bold-duotone',
  'solar:bolt-bold-duotone',
  'solar:waterdrops-bold-duotone',
  'solar:wi-fi-router-bold-duotone',
  'solar:smartphone-2-bold-duotone',
  'solar:bus-bold-duotone',
  'solar:gas-station-bold-duotone',
  'solar:square-academic-cap-bold-duotone',
  'solar:health-bold-duotone',
  'solar:t-shirt-bold-duotone',
  'solar:home-smile-bold-duotone',
  'solar:gift-bold-duotone',
  'solar:heart-bold-duotone',
  'solar:gamepad-bold-duotone',
  'solar:card-transfer-bold-duotone',
  'solar:users-group-rounded-bold-duotone',
  'solar:case-bold-duotone',
  'solar:hand-money-bold-duotone',
  'solar:graph-up-bold-duotone',
  'solar:shop-bold-duotone',
  'solar:star-bold-duotone',
  'solar:suitcase-bold-duotone',
  'solar:cat-bold-duotone',
  'solar:menu-dots-bold-duotone',
] as const

export const WALLET_ICONS = [
  'solar:wallet-money-bold-duotone',
  'solar:banknote-2-bold-duotone',
  'solar:card-bold-duotone',
  'solar:smartphone-bold-duotone',
  'solar:safe-square-bold-duotone',
  'solar:wallet-bold-duotone',
] as const

export const BOOK_ICONS = [
  'solar:home-smile-bold-duotone',
  'solar:book-bold-duotone',
  'solar:shop-bold-duotone',
  'solar:user-bold-duotone',
  'solar:users-group-rounded-bold-duotone',
  'solar:suitcase-bold-duotone',
] as const

export const PALETTE = [
  '#1E5EFF', '#0EA5E9', '#14B8A6', '#16A34A', '#84CC16', '#F59E0B',
  '#F97316', '#E5484D', '#EC4899', '#8B5CF6', '#6366F1', '#64748B',
] as const

/** Icon yang dipakai di file .ts (scanner @nuxt/icon hanya membaca file .vue) */
export const SCRIPT_ICONS = [
  'lucide:calendar',
  'lucide:trending-up',
  'lucide:lightbulb',
  'lucide:triangle-alert',
  'lucide:circle-check',
  'lucide:arrow-left-right',
] as const

export const DYNAMIC_ICONS = [...new Set([...CATEGORY_ICONS, ...WALLET_ICONS, ...BOOK_ICONS, ...SCRIPT_ICONS])]
