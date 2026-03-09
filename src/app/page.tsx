// src/app/page.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import NewsBlock from '@/components/news/NewsBlock'

export default async function Home() {
  const session = await getServerSession()
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Колонка 1 */}
      <div>
       
      </div>

      {/* Колонка 2*/}
<div className="lg:sticky lg:top-20 lg:self-start lg:max-h-screen lg:overflow-y-auto">
  <NewsBlock />
</div>
      
    </div>
  )
}