// src/components/markets/MarketList.tsx
import MarketCard from './MarketCard'

interface Market {
  id: string
  question: string
  endDate: Date
  _count: { bets: number }
}

export default function MarketList({ markets }: { markets: Market[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => (
        <MarketCard
          key={market.id}
          id={market.id}
          question={market.question}
          endDate={market.endDate}    
          betCount={market._count.bets}
        />
      ))}
    </div>
  )
}