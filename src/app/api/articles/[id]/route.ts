import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateArticleSchema } from '@/lib/validations/article'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const article = await prisma.article.findUnique({
    where: { id },
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

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const existing = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.authorId !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = updateArticleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const article = await prisma.article.update({
    where: { id },
    data: parsed.data,
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

  return NextResponse.json(article)
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const existing = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.authorId !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

