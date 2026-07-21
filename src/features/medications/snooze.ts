export type SnoozeMinutes = 10 | 15 | 30

export const SNOOZE_MINUTES: SnoozeMinutes[] = [10, 15, 30]

export function isSnoozeMinutes(value: number): value is SnoozeMinutes {
  return SNOOZE_MINUTES.includes(value as SnoozeMinutes)
}
