// src/app/markets/page.tsx
import { prisma } from '@/lib/prisma'
import MarketList from '@/components/markets/MarketList'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function MarketsPage() {
  const session = await getServerSession(authOptions)
  const markets = await prisma.market.findMany({
    include: {
      _count: {
        select: { bets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Активные рынки</h1>
        {session && (
          <Button asChild>
            <Link href="/markets/new">+ Создать рынок</Link>
          </Button>
        )}
      </div>
      <MarketList markets={markets} />
    </div>
  )
}