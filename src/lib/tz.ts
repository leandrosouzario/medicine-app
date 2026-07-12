import { cookies } from 'next/headers'

/**
 * Lê o offset de fuso horário do cookie gravado pelo TzSetter no browser.
 * Retorna 0 (UTC) se o cookie não existir ou for inválido.
 * Ex.: UTC-3 → 180; UTC+5:30 → -330.
 */
export async function getTzOffsetMinutes(): Promise<number> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('tz_offset_min')?.value
  if (!raw) return 0
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
