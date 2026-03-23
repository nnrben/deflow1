import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArticleSchema } from '@/lib/validations/article'
import { normalizeHashtag, stripMarkdownToPreview, uniqueHashtags } from '@/lib/blog/tags'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const query = req.nextUrl.searchParams.get('query')?.trim() ?? ''
  const normalizedQuery = normalizeHashtag(query)

  const articles = await prisma.article.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { contentMd: { contains: query, mode: 'insensitive' } },
            {
              tags: {
                some: {
                  tag: {
                    normalizedName: { contains: normalizedQuery, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }
      : undefined,
    select: {
      id: true,
      title: true,
      contentMd: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      _count: { select: { likes: true } },
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
      likes: session?.user
        ? {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          }
        : false,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(
    articles.map(article => ({
      id: article.id,
      title: article.title,
      authorId: article.authorId,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
      preview: stripMarkdownToPreview(article.contentMd, 250),
      hashtags: article.tags.map(item => item.tag.name),
      likesCount: article._count.likes,
      likedByMe: Array.isArray(article.likes) ? article.likes.length > 0 : false,
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createArticleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { title, contentMd, hashtags } = parsed.data

  const article = await prisma.$transaction(async tx => {
    const created = await tx.article.create({
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
        _count: { select: { likes: true } },
      },
    })

    const unique = uniqueHashtags(hashtags)
    for (const hashtag of unique) {
      const normalizedName = normalizeHashtag(hashtag)
      const tag = await tx.tag.upsert({
        where: { normalizedName },
        update: { name: hashtag },
        create: {
          name: hashtag,
          normalizedName,
        },
        select: { id: true, name: true },
      })

      await tx.articleTag.create({
        data: {
          articleId: created.id,
          tagId: tag.id,
        },
      })
    }

    return {
      ...created,
      hashtags: unique,
    }
  })

  return NextResponse.json(
    {
      ...article,
      preview: stripMarkdownToPreview(article.contentMd, 250),
      likesCount: article._count.likes,
      likedByMe: false,
    },
    { status: 201 }
  )
}
