import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCommentSchema } from '@/lib/validations/comment'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await ctx.params

  const comments = await prisma.comment.findMany({
    where: { articleId: id },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: { select: { name: true } },
      _count: { select: { likes: true } },
      likes: session?.user
        ? {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          }
        : false,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(
    comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      author: comment.author,
      likesCount: comment._count.likes,
      likedByMe: Array.isArray(comment.likes) ? comment.likes.length > 0 : false,
    }))
  )
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      articleId: id,
      authorId: session.user.id,
      content: parsed.data.content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: { select: { name: true } },
      _count: { select: { likes: true } },
    },
  })

  return NextResponse.json(
    {
      ...comment,
      likesCount: comment._count.likes,
      likedByMe: false,
    },
    { status: 201 }
  )
}
