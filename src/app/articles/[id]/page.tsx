import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { MarkdownView } from '@/components/blog/MarkdownView'
import { ArticleComments } from '@/components/blog/ArticleComments'
import { ArticleLikeButton } from '@/components/blog/ArticleLikeButton'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contentMd: true,
      createdAt: true,
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
      likes: session?.user
        ? {
            where: { userId: session.user.id },
            select: { id: true },
            take: 1,
          }
        : false,
      comments: {
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
      },
    },
  })

  if (!article) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
        <div className="mb-8 border-b border-gray-200 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <h1 className="text-3xl font-semibold text-gray-950">{article.title}</h1>
            <ArticleLikeButton
              articleId={article.id}
              initialLikesCount={article._count.likes}
              initialLikedByMe={Array.isArray(article.likes) ? article.likes.length > 0 : false}
            />
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {article.author?.name ?? 'Без имени'} · {new Date(article.createdAt).toLocaleDateString('ru-RU')}
          </div>
          {article.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map(item => (
                <span key={item.tag.name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {item.tag.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <MarkdownView value={article.contentMd} />
        <ArticleComments
          articleId={article.id}
          initialComments={article.comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            authorId: comment.authorId,
            author: comment.author,
            likesCount: comment._count.likes,
            likedByMe: Array.isArray(comment.likes) ? comment.likes.length > 0 : false,
          }))}
        />
      </div>
    </main>
  )
}
