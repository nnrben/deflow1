import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArticleSchema } from '@/lib/validations/article'

export async function GET() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createArticleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { title, contentMd } = parsed.data

  const article = await prisma.article.create({
    data: {
      title,
      contentMd,
      authorId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      contentMd: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  })

  return NextResponse.json(article, { status: 201 })
}

