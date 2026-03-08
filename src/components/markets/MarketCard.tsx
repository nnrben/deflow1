// src/components/markets/MarketCard.tsx
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MarketCardProps {
  id: string
  question: string
  endDate: Date
  betCount: number
}

export default function MarketCard({ id, question, endDate, betCount }: MarketCardProps) {
  const timeLeft = formatDistanceToNow(endDate, { locale: ru, addSuffix: true })

  return (
    <Link href={`/markets/${id}`} className="block border rounded-lg p-4 hover:shadow-md transition">
      <h3 className="text-lg font-semibold mb-2">{question}</h3>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Ставок: {betCount}</span>
        <span>{timeLeft}</span>
      </div>
    </Link>
  )
}