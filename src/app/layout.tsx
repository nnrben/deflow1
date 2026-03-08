// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers' // создадим ниже

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Prediction Platform',
  description: 'Создавайте и участвуйте в рынках предсказаний',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}