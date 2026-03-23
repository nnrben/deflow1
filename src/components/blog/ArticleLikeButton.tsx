'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : 'Request failed'
    throw new Error(msg)
  }
  return data as T
}

export function ArticleLikeButton({
  articleId,
  initialLikesCount,
  initialLikedByMe,
  className,
}: {
  articleId: string
  initialLikesCount: number
  initialLikedByMe: boolean
  className?: string
}) {
  const { data: session } = useSession()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!session?.user || loading) return

    setLoading(true)

    try {
      const res = await fetch(`/api/articles/${articleId}/like`, {
        method: likedByMe ? 'DELETE' : 'POST',
      })

      const data = await jsonOrThrow<{ likesCount: number; likedByMe: boolean }>(res)
      setLikesCount(data.likesCount)
      setLikedByMe(data.likedByMe)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={likedByMe ? 'default' : 'outline'}
      onClick={handleClick}
      disabled={!session?.user || loading}
      className={`gap-2 ${className ?? ''}`.trim()}
      type="button"
      title={session?.user ? 'Поставить или убрать лайк' : 'Лайки доступны после авторизации'}
      aria-pressed={likedByMe}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {likedByMe ? '♥' : '♡'}
      </span>
      <span className="leading-none">{likesCount}</span>
    </Button>
  )
}
