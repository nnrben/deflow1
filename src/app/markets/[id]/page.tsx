// src/app/markets/[id]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import BetForm from '@/components/markets/BetForm'
import ResolveMarketButtons from '@/components/markets/ResolveMarketButtons'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MarketPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      bets: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!market) {
    notFound()
  }

  // Подсчёт статистики
  const totalBets = market.bets.length
  const yesBets = market.bets.filter(b => b.outcome === true).length
  const yesPercentage = totalBets ? Math.round((yesBets / totalBets) * 100) : 0

  // Суммы ставок для расчёта выигрыша
  const totalYes = market.bets.filter(b => b.outcome).reduce((sum, b) => sum + b.amount, 0)
  const totalNo = market.bets.filter(b => !b.outcome).reduce((sum, b) => sum + b.amount, 0)
  const totalPool = totalYes + totalNo

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">{market.question}</h1>
      <p className="text-gray-600 mb-4">
        Создатель: {market.creator.name || 'Аноним'} | 
        Окончание: {format(new Date(market.endDate), 'd MMMM yyyy, HH:mm', { locale: ru })}
      </p>
      {market.description && (
        <p className="mb-6 p-4 bg-gray-50 rounded">{market.description}</p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Левая колонка: статистика */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Текущие ставки</h2>
          <div className="border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span>Да: {yesPercentage}%</span>
              <span>Нет: {100 - yesPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${yesPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Всего ставок: {totalBets}</p>
          </div>

          <h3 className="font-semibold mt-6">Последние ставки</h3>
          <ul className="space-y-2">
            {market.bets.slice(0, 5).map(bet => (
              <li key={bet.id} className="text-sm border-b pb-1">
                {bet.user.name || 'Аноним'}: {bet.outcome ? '✅ Да' : '❌ Нет'} — {bet.amount} кредитов
              </li>
            ))}
          </ul>
        </div>

        {/* Правая колонка: форма ставки */}
        <div>
          {session ? (
            new Date() < new Date(market.endDate) && market.status === 'ACTIVE' ? (
              <BetForm marketId={market.id} marketEndDate={market.endDate.toString()} />
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-center">Этот рынок закрыт для ставок.</p>
              </div>
            )
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50 text-center">
              <p>Чтобы сделать ставку, <a href="/api/auth/signin" className="text-blue-600 underline">войдите</a></p>
            </div>
          )}
        </div>
      </div>

      {/* Разрешение рынка (только для создателя) */}
      {session?.user?.id === market.creatorId && market.status === 'ACTIVE' && new Date() > new Date(market.endDate) && (
        <div className="mt-8 border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Разрешить рынок</h2>
          <ResolveMarketButtons marketId={market.id} />
        </div>
      )}

      {/* Отображение результатов, если рынок разрешён */}
      {market.status === 'RESOLVED' && market.resolution !== null && (
        <div className="mt-8 border rounded-lg p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Рынок разрешён</h2>
          <p className="mb-2">Правильный исход: <strong>{market.resolution ? 'ДА' : 'НЕТ'}</strong></p>
          {session && (() => {
            const userBet = market.bets.find(bet => bet.userId === session.user.id)
            if (!userBet) return <p>Вы не участвовали в этом рынке.</p>
            const userWon = userBet.outcome === market.resolution
            if (userWon) {
              const winningTotal = market.resolution ? totalYes : totalNo
              const winAmount = Math.floor(userBet.amount * totalPool / winningTotal)
              return (
                <div>
                  <p className="text-green-600 font-semibold">Вы выиграли!</p>
                  <p>Ваша ставка: {userBet.amount} кредитов</p>
                  <p>Выигрыш: {winAmount} кредитов</p>
                </div>
              )
            } else {
              return <p className="text-red-600">Вы проиграли. Ваша ставка: {userBet.amount} кредитов</p>
            }
          })()}
        </div>
      )}
    </div>
  )
}
