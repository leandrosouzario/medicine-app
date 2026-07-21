import type { Medication } from '@/lib/db/types'

export function tracksStock(medication: Medication): boolean {
  return medication.stockQuantity != null
}

export function isLowStock(medication: Medication): boolean {
  if (!tracksStock(medication)) {
    return false
  }

  return medication.stockQuantity! <= medication.refillThreshold
}

export function formatStock(medication: Medication): string | null {
  if (!tracksStock(medication)) {
    return null
  }

  const units = medication.stockQuantity!
  const label = units === 1 ? 'unidade' : 'unidades'
  return `${units} ${label}`
}
