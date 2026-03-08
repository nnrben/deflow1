// src/app/page.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import MarketList from '@/components/markets/MarketList'

export default async function Home() {
  const session = await getServerSession() // можно не передавать, если не нужно
  const markets = await prisma.market.findMany({
    include: {
      _count: {
        select: { bets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <>
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
    </>
  )
}
