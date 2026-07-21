import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { PWA_APPLE_TOUCH_ICON } from '@/lib/pwa-icons'
import './globals.css'

export const metadata: Metadata = {
  title: 'Remédios — Controle de medicamentos',
  description:
    'Registre medicamentos, horários e acompanhe o que tomar hoje. Dados sincronizados na sua conta.',
  applicationName: 'Remédios',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Remédios',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: PWA_APPLE_TOUCH_ICON, sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
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
      <head>
        <link rel="apple-touch-icon" href={PWA_APPLE_TOUCH_ICON} sizes="180x180" />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
