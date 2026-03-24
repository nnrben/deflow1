// src/app/profile/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/api/auth/signin')
  }

  const [user, articlesCount, commentsCount, articleLikesCount, commentLikesCount] =
    await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          createdMarkets: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          bets: {
            include: { market: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
      prisma.article.count({
        where: { authorId: session.user.id },
      }),
      prisma.comment.count({
        where: { authorId: session.user.id },
      }),
      prisma.articleLike.count({
        where: {
          article: {
            authorId: session.user.id,
          },
        },
      }),
      prisma.commentLike.count({
        where: {
          comment: {
            authorId: session.user.id,
          },
        },
      }),
    ])

  if (!user) {
    redirect('/api/auth/signin')
  }

  const stats = [
    { label: 'Статьи', value: articlesCount },
    { label: 'Лайки', value: articleLikesCount + commentLikesCount },
    { label: 'Комментарии', value: commentsCount },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>
      <div className="grid gap-6">
        <div className="border rounded-lg p-4">
          <p><strong>Имя:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Баланс:</strong> {user.balance} кредитов</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(stat => (
            <div key={stat.label} className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Мои рынки</h2>
          {user.createdMarkets.length ? (
            <ul className="space-y-2">
              {user.createdMarkets.map(market => (
                <li key={market.id}>
                  <Link href={`/markets/${market.id}`} className="text-blue-600 hover:underline">
                    {market.question}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Вы ещё не создавали рынков.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Мои ставки</h2>
          {user.bets.length ? (
            <ul className="space-y-2">
              {user.bets.map(bet => (
                <li key={bet.id} className="border-b pb-2">
                  <Link href={`/markets/${bet.market.id}`} className="text-blue-600 hover:underline">
                    {bet.market.question}
                  </Link>
                  <span className="ml-2 text-sm">
                    {bet.outcome ? '✅ Да' : '❌ Нет'} — {bet.amount} кредитов
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Вы ещё не сделали ни одной ставки.</p>
          )}
        </div>
      </div>
    </div>
  )
}
