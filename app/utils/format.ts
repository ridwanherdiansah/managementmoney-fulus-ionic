import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

export { dayjs }

const rupiahFmt = new Intl.NumberFormat('id-ID')

/** 1250000 -> "Rp 1.250.000" */
export function rupiah(n: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.round(Math.abs(n))
  const sign = n < 0 ? '-' : opts.sign && n > 0 ? '+' : ''
  return `${sign}Rp ${rupiahFmt.format(abs)}`
}

/** 1250000 -> "1,25jt", 45000 -> "45rb" */
export function rupiahShort(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const trim = (v: number) => v.toFixed(abs >= 10_000_000 && abs < 1e9 ? 1 : 2).replace(/\.?0+$/, '').replace('.', ',')
  if (abs >= 1e9) return `${sign}${trim(abs / 1e9)}M`
  if (abs >= 1e6) return `${sign}${trim(abs / 1e6)}jt`
  if (abs >= 1e3) return `${sign}${Math.round(abs / 1e3)}rb`
  return `${sign}${abs}`
}

/** Angka saja dengan pemisah ribuan: 1250000 -> "1.250.000" */
export const thousands = (n: number) => rupiahFmt.format(n)

/** Label grup tanggal: "Hari ini", "Kemarin", "Senin, 2 Nov 2026" */
export function dayLabel(ts: number): string {
  const d = dayjs(ts).startOf('day')
  const today = dayjs().startOf('day')
  if (d.isSame(today)) return 'Hari ini'
  if (d.isSame(today.subtract(1, 'day'))) return 'Kemarin'
  return d.format(d.year() === today.year() ? 'dddd, D MMM' : 'dddd, D MMM YYYY')
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export interface Period {
  start: number
  /** eksklusif */
  end: number
  label: string
  days: number
}

/**
 * Periode bulanan yang bisa dimulai dari tanggal tertentu (mis. tanggal gajian).
 * offset 0 = periode berjalan, -1 = periode sebelumnya, dst.
 */
export function getPeriod(offset: number, startDay = 1): Period {
  const today = dayjs().startOf('day')
  let start = today.date() >= startDay ? today.date(startDay) : today.subtract(1, 'month').date(startDay)
  start = start.add(offset, 'month').startOf('day')
  const end = start.add(1, 'month')
  const label = startDay === 1
    ? start.format('MMMM YYYY')
    : `${start.format('D MMM')} – ${end.subtract(1, 'day').format('D MMM YYYY')}`
  return { start: start.valueOf(), end: end.valueOf(), label, days: end.diff(start, 'day') }
}
