import type { MetadataRoute } from 'next'
import { PWA_MANIFEST_ICONS } from '@/lib/pwa-icons'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'medicine-app',
    name: 'Remédios',
    short_name: 'Remédios',
    description: 'Controle de medicamentos e horários de uso',
    start_url: '/hoje',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'pt-BR',
    categories: ['health', 'medical'],
    icons: PWA_MANIFEST_ICONS.map((icon) => ({ ...icon })),
  }
}
