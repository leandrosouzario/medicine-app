import type { SupabaseClient } from '@supabase/supabase-js'
import { endOfDayWithOffset } from '@/lib/dates'

/**
 * Marca como perdidas doses pendentes cujo dia local já terminou.
 * Doses atrasadas no mesmo dia permanecem pendentes para registro tardio.
 */
export async function markMissedPendingDoses(
  supabase: SupabaseClient,
  userId: string,
  tzOffsetMinutes: number,
  now = new Date(),
): Promise<number> {
  const { data: pendingRows, error: fetchError } = await supabase
    .from('med_dose_events')
    .select('id, scheduled_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('scheduled_at', now.toISOString())

  if (fetchError) {
    throw fetchError
  }

  if (!pendingRows?.length) {
    return 0
  }

  const idsToMiss = pendingRows
    .filter((row) => {
      const scheduledAt = new Date(row.scheduled_at)
      const dayEnd = endOfDayWithOffset(scheduledAt, tzOffsetMinutes)
      return now > dayEnd
    })
    .map((row) => row.id)

  if (idsToMiss.length === 0) {
    return 0
  }

  const { data, error } = await supabase
    .from('med_dose_events')
    .update({ status: 'missed' })
    .in('id', idsToMiss)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    throw error
  }

  return data?.length ?? 0
}

export function shouldMarkAsMissed(
  scheduledAt: string,
  tzOffsetMinutes: number,
  now = new Date(),
): boolean {
  const dayEnd = endOfDayWithOffset(new Date(scheduledAt), tzOffsetMinutes)
  return now > dayEnd
}
