import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateArticleSchema } from '@/lib/validations/article'
import { normalizeHashtag, stripMarkdownToPreview, uniqueHashtags } from '@/lib/blog/tags'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
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
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              normalizedName: true,
            },
          },
        },
      },
      _count: { select: { likes: true } },
      likes: session?.user
        ? {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          }
        : false,
    },
  })

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: article.id,
    title: article.title,
    contentMd: article.contentMd,
    authorId: article.authorId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: article.author,
    preview: stripMarkdownToPreview(article.contentMd, 250),
    hashtags: article.tags.map(item => item.tag.name),
    likesCount: article._count.likes,
    likedByMe: Array.isArray(article.likes) ? article.likes.length > 0 : false,
  })
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

  const article = await prisma.$transaction(async tx => {
    if (parsed.data.hashtags) {
      await tx.articleTag.deleteMany({
        where: { articleId: id },
      })

      for (const hashtag of uniqueHashtags(parsed.data.hashtags)) {
        const normalizedName = normalizeHashtag(hashtag)
        const tag = await tx.tag.upsert({
          where: { normalizedName },
          update: { name: hashtag },
          create: {
            name: hashtag,
            normalizedName,
          },
          select: { id: true },
        })

        await tx.articleTag.create({
          data: {
            articleId: id,
            tagId: tag.id,
          },
        })
      }
    }

    const updated = await tx.article.update({
      where: { id },
      data: {
        title: parsed.data.title,
        contentMd: parsed.data.contentMd,
      },
      select: {
        id: true,
        title: true,
        contentMd: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { name: true } },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: { select: { likes: true } },
      },
    })

    return updated
  })

  return NextResponse.json({
    ...article,
    preview: stripMarkdownToPreview(article.contentMd, 250),
    hashtags: article.tags.map(item => item.tag.name),
    likesCount: article._count.likes,
    likedByMe: false,
  })
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
