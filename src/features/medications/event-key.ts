export function doseEventKey(medicationId: string, scheduledAt: string): string {
  return `${medicationId}:${new Date(scheduledAt).getTime()}`
}
