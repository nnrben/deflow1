import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const resolveSchema = z.object({
  outcome: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: marketId } = await params
  const body = await req.json()
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { outcome } = parsed.data

  try {
    // Получаем рынок с создателем и всеми ставками
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        bets: true,
      },
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Проверяем права: только создатель может разрешить (или админ)
    if (market.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (market.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Market already resolved' }, { status: 400 })
    }

    if (new Date() < market.endDate) {
      return NextResponse.json({ error: 'Market has not ended yet' }, { status: 400 })
    }

    // Считаем суммы ставок
    let totalYes = 0, totalNo = 0
    market.bets.forEach(bet => {
      if (bet.outcome) totalYes += bet.amount
      else totalNo += bet.amount
    })
    const totalPool = totalYes + totalNo

    // Определяем выигрышный пул
    const winningOutcome = outcome
    const winningTotal = outcome ? totalYes : totalNo

    if (winningTotal === 0) {
      return NextResponse.json({ error: 'No winning bets' }, { status: 400 })
    }

    // Собираем операции для транзакции
    const operations = []

    // 1. Обновляем рынок
    operations.push(
      prisma.market.update({
        where: { id: marketId },
        data: {
          status: 'RESOLVED',
          resolution: outcome,
        },
      })
    )

    // 2. Для каждой выигрышной ставки начисляем выигрыш
    for (const bet of market.bets) {
      if (bet.outcome === outcome) {
        const winAmount = Math.floor(bet.amount * totalPool / winningTotal)
        operations.push(
          prisma.user.update({
            where: { id: bet.userId },
            data: { balance: { increment: winAmount } },
          })
        )
      }
    }

    // Выполняем транзакцию
    await prisma.$transaction(operations)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
