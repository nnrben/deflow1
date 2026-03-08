import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createMarketSchema } from '@/lib/validations/market';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createMarketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { question, description, endDate } = parsed.data;

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