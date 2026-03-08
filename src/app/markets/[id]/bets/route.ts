import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { betSchema } from '@/lib/validations/bet'

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
  const parsed = betSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { outcome, amount } = parsed.data

  try {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
    })
    if (!market || market.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Market not active' }, { status: 400 })
    }
    if (new Date() > market.endDate) {
      return NextResponse.json({ error: 'Market ended' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const existingBet = await prisma.bet.findUnique({
      where: {
        userId_marketId: {
          userId: session.user.id,
          marketId,
        },
      },
    })
    if (existingBet) {
      return NextResponse.json({ error: 'Already bet on this market' }, { status: 400 })
    }

    const result = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.bet.create({
        data: {
          amount,
          outcome,
          userId: session.user.id,
          marketId,
        },
      }),
    ])

    return NextResponse.json(result[1], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}