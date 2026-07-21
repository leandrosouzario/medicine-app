import { HistoricoClient } from '@/features/medications/components/HistoricoClient'
import type { HistoryPeriod } from '@/features/medications/history'
import { getHistory } from '@/features/medications/queries'

type HistoricoPageProps = {
  searchParams: Promise<{ period?: string }>
}

export default async function HistoricoPage({ searchParams }: HistoricoPageProps) {
  const params = await searchParams
  const period: HistoryPeriod = params.period === '30' ? 30 : 7
  const data = await getHistory(period)

  return <HistoricoClient {...data} />
}
