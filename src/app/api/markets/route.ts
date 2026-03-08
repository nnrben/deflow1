import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createMarketSchema } from '@/lib/validations/market';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createMarketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { question, description, endDate } = parsed.data;

  // Проверка авторизации: либо сессия пользователя, либо секретный ключ бота
  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.BOT_API_SECRET}`) {
    // Это бот – нужно определить, какой именно бот (опционально)
    // Можно найти бота по email или создать запись, если нужно.
    // Для простоты создадим рынок от имени первого найденного бота-пользователя.
    const botUser = await prisma.user.findFirst({
      where: { isBot: true },
    });
    if (!botUser) {
      return NextResponse.json({ error: 'No bot user found' }, { status: 500 });
    }
    try {
      const market = await prisma.market.create({
        data: {
          question,
          description,
          endDate: new Date(endDate),
          status: 'ACTIVE',
          creatorId: botUser.id,
        },
      });
      return NextResponse.json(market, { status: 201 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // Если не бот – проверяем обычную сессию
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const market = await prisma.market.create({
      data: {
        question,
        description,
        endDate: new Date(endDate),
        status: 'ACTIVE',
        creatorId: session.user.id,
      },
    });
    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
