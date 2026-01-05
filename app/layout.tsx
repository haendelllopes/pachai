import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pachai - Espaço de Escuta Contínua',
  description: 'Pachai é um espaço de escuta contínua para decisões conscientes de produto.',
  manifest: '/manifest.json',
  themeColor: '#1a1a1a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pachai',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pachai" />
      </head>
      <body>{children}</body>
    </html>
  )
}

