import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HEXIS Law — Legal Management System',
  description: 'Internal CRM for HEXIS Law Firm, New Delhi',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
