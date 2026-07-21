import type { SupabaseClient } from '@supabase/supabase-js'

/** Marca como perdidas doses pendentes cujo horário já passou. */
export async function markMissedPendingDoses(
  supabase: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<number> {
  const { data, error } = await supabase
    .from('med_dose_events')
    .update({ status: 'missed' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('scheduled_at', now.toISOString())
    .select('id')

  if (error) {
    throw error
  }

  return data?.length ?? 0
}
