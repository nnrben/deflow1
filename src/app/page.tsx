// src/app/page.tsx
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import HomeClient from './HomeClient';

export default async function Home() {
  const session = await getServerSession();
  const markets = await prisma.market.findMany({
    include: {
      _count: {
        select: { bets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return <HomeClient />;
}