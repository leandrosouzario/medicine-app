import { MedicationForm } from '@/features/medications/components/MedicationForm'
import { defaultMedicationInput } from '@/features/medications/input'

export default function NovoMedicamentoPage() {
  return <MedicationForm mode="create" initialValues={defaultMedicationInput()} />
}
