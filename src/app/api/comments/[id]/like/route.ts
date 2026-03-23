import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getLikePayload(commentId: string, userId: string) {
  const likesCount = await prisma.commentLike.count({
    where: { commentId },
  })

  const likedByMe = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
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
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  await prisma.commentLike.upsert({
    where: {
      commentId_userId: {
        commentId: id,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      commentId: id,
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

  await prisma.commentLike.deleteMany({
    where: {
      commentId: id,
      userId: session.user.id,
    },
  })

  return NextResponse.json(await getLikePayload(id, session.user.id))
}
