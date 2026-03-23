'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { CommentLikeButton } from '@/components/blog/CommentLikeButton'

type ArticleComment = {
  id: string
  content: string
  createdAt: string | Date
  updatedAt: string | Date
  authorId: string
  author: { name: string | null }
  likesCount: number
  likedByMe: boolean
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : 'Request failed'
    throw new Error(msg)
  }
  return data as T
}

export function ArticleComments({
  articleId,
  initialComments,
}: {
  articleId: string
  initialComments: ArticleComment[]
}) {
  const { data: session } = useSession()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleReply = (authorName: string | null) => {
    if (!session?.user) return

    const mention = `@${authorName?.trim() || 'user'} `
    setContent(current => {
      if (current.includes(mention)) {
        return current
      }

      return current.trim().length === 0 ? mention : `${current}\n${mention}`
    })

    queueMicrotask(() => {
      textareaRef.current?.focus()
    })
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      const created = await jsonOrThrow<ArticleComment>(res)
      setComments(current => [...current, created])
      setContent('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ошибка отправки комментария')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-950">Комментарии</h2>
        <div className="text-sm text-gray-500">{comments.length}</div>
      </div>

      {session?.user ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={event => setContent(event.target.value)}
            className="min-h-[110px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="Напишите комментарий. Для ответа можно использовать @Имя"
          />
          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSubmit} disabled={loading || content.trim().length === 0}>
              {loading ? 'Отправка...' : 'Добавить комментарий'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Комментировать могут только авторизованные пользователи.
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Пока нет комментариев.
          </div>
        ) : (
          comments.map(comment => (
            <article key={comment.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <div className="font-medium text-gray-900">{comment.author?.name ?? 'Без имени'}</div>
                <div className="text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{comment.content}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CommentLikeButton
                  commentId={comment.id}
                  initialLikesCount={comment.likesCount}
                  initialLikedByMe={comment.likedByMe}
                />
                {session?.user ? (
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => handleReply(comment.author?.name ?? null)}
                  >
                    Ответить через @
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
