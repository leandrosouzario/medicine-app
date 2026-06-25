import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Remédios — Controle de medicamentos',
  description:
    'Registre medicamentos, horários e acompanhe o que tomar hoje. Dados salvos no seu dispositivo.',
  applicationName: 'Remédios',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Remédios',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0891b2' },
    { media: '(prefers-color-scheme: dark)', color: '#083344' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
