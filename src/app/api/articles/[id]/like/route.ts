import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getLikePayload(articleId: string, userId: string) {
  const likesCount = await prisma.articleLike.count({
    where: { articleId },
  })

  const likedByMe = await prisma.articleLike.findUnique({
    where: {
      articleId_userId: {
        articleId,
        userId,
      },
    },
    select: { id: true },
  })

  return {
    likesCount,
    likedByMe: Boolean(likedByMe),
  }
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  await prisma.articleLike.upsert({
    where: {
      articleId_userId: {
        articleId: id,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      articleId: id,
      userId: session.user.id,
    },
  })

  return NextResponse.json(await getLikePayload(id, session.user.id))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  await prisma.articleLike.deleteMany({
    where: {
      articleId: id,
      userId: session.user.id,
    },
  })

  return NextResponse.json(await getLikePayload(id, session.user.id))
}
