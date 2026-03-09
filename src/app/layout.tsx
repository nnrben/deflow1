// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'DEFLOW — Умные инструменты для трейдеров',
  description: 'Интеллектуальная платформа для инвестиций и анализа финансовых рынков',
  keywords: 'трейдинг, инвестиции, анализ рынка, финансовые инструменты, биржа',
  openGraph: {
    title: 'DEFLOW — Умные инструменты для трейдеров',
    description: 'Интеллектуальная платформа для инвестиций и анализа финансовых рынков',
    url: 'https://deflow.ru',
    siteName: 'DEFLOW',
    images: [
      {
        url: 'https://deflow.ru/android-chrome-512x512.png',
        width: 512,
        height: 512,
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto px-4 pt-20 pb-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}