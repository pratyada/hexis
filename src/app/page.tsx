import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HEXIS Law — Legal Management System',
  description:
    'AI-powered legal management for Indian law firms. Intelligent drafting with Vaakil AI, NIC eCourts integration, and smart document vault — built for Delhi advocates.',
  metadataBase: new URL('https://hexis-nu.vercel.app'),
  openGraph: {
    title: 'HEXIS Law — Legal Management System',
    description:
      'AI-powered legal management for Indian law firms. Intelligent drafting with Vaakil AI, NIC eCourts integration, and smart document vault — built for Delhi advocates.',
    url: 'https://hexis-nu.vercel.app',
    siteName: 'HEXIS Law',
    images: [
      {
        url: 'https://hexis-nu.vercel.app/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'HEXIS Law — Legal Management System',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEXIS Law — Legal Management System',
    description:
      'AI-powered legal management for Indian law firms. Intelligent drafting, NIC eCourts integration, smart document vault.',
    images: ['https://hexis-nu.vercel.app/opengraph-image'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default async function RootPage() {
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }
  redirect('/login')
}
