import { RetroactiveDoseForm } from '@/features/medications/components/RetroactiveDoseForm'
import { getRetroactiveDoseFormData } from '@/features/medications/queries'

export default async function RegistrarPassadoPage() {
  const medications = await getRetroactiveDoseFormData()

  return <RetroactiveDoseForm medications={medications} />
}
