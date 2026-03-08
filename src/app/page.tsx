// src/app/page.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import MarketList from '@/components/markets/MarketList'

export default async function Home() {
  const session = await getServerSession(authOptions)
  const markets = await prisma.market.findMany({
    include: {
      _count: {
        select: { bets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10, // Показываем последние 10 рынков на главной
  })

  return (
    <div className="min-h-screen">
      {/* Шапка с навигацией */}
      <header className="border-b mb-8">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            PredictPlatform
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/markets" className="text-gray-700 hover:text-blue-600">
              Все рынки
            </Link>
            {session ? (
              <>
                <span className="text-sm text-gray-600">
                  {session.user.name} ({session.user.balance} кредитов)
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href="/markets/new">Создать рынок</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/api/auth/signout">Выйти</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/api/auth/signin">Войти</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Основной контент */}
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Активные рынки предсказаний</h1>
        {markets.length > 0 ? (
          <MarketList markets={markets} />
        ) : (
          <p className="text-gray-500">Пока нет созданных рынков. Будьте первым!</p>
        )}
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/markets">Посмотреть все рынки →</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}