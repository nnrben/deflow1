'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { ArticleLikeButton } from '@/components/blog/ArticleLikeButton'
import { formatHashtag } from '@/lib/blog/tags'

type ArticleListItem = {
  id: string
  title: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: { name: string | null }
  preview: string
  hashtags: string[]
  likesCount: number
  likedByMe: boolean
}

type Article = ArticleListItem & {
  contentMd: string
}

type TagSuggestion = {
  id: string
  name: string
  hashtag: string
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : 'Request failed'
    throw new Error(msg)
  }
  return data as T
}

export default function BlogTab() {
  const { data: session } = useSession()
  const myUserId = session?.user?.id ?? null

  const [items, setItems] = useState<ArticleListItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mode, setMode] = useState<'idle' | 'edit' | 'create'>('idle')

  const [title, setTitle] = useState('')
  const [contentMd, setContentMd] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const getErrorMessage = (error: unknown, fallback = 'Ошибка') => {
    return error instanceof Error ? error.message : fallback
  }

  const loadList = async (query?: string) => {
    const suffix = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''
    const res = await fetch(`/api/articles${suffix}`, { cache: 'no-store' })
    const data = await jsonOrThrow<ArticleListItem[]>(res)
    setItems(data)
  }

  const loadTagSuggestions = async (query: string) => {
    const normalized = formatHashtag(query)
    if (!normalized) {
      setTagSuggestions([])
      return
    }

    const res = await fetch(`/api/tags?query=${encodeURIComponent(normalized)}`, { cache: 'no-store' })
    const data = await jsonOrThrow<TagSuggestion[]>(res)
    setTagSuggestions(data.filter(tag => !hashtags.includes(tag.hashtag)))
  }

  const loadOne = async (id: string) => {
    const res = await fetch(`/api/articles/${id}`, { cache: 'no-store' })
    return jsonOrThrow<Article>(res)
  }

  useEffect(() => {
    loadList().catch(error => setError(getErrorMessage(error)))
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadList(searchQuery).catch(error => setError(getErrorMessage(error)))
    }, 250)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  const resetEditor = () => {
    setEditingId(null)
    setTitle('')
    setContentMd('')
    setHashtags([])
    setTagInput('')
    setTagSuggestions([])
    setMode('idle')
  }

  const startCreate = () => {
    setError(null)
    setEditingId(null)
    setMode('create')
    setTitle('Новая статья')
    setContentMd(`# Заголовок\n\nТекст в **Markdown**.\n\n- пункт 1\n- пункт 2\n`)
    setHashtags([])
    setTagInput('')
    setTagSuggestions([])
  }

  const startEdit = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const article = await loadOne(id)
      setEditingId(article.id)
      setTitle(article.title)
      setContentMd(article.contentMd)
      setHashtags(article.hashtags)
      setTagInput('')
      setTagSuggestions([])
      setMode('edit')
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setLoading(true)
    setError(null)

    try {
      if (mode === 'create') {
        await jsonOrThrow<Article>(
          await fetch('/api/articles', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title, contentMd, hashtags }),
          })
        )
      } else if (mode === 'edit' && editingId) {
        await jsonOrThrow<Article>(
          await fetch(`/api/articles/${editingId}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title, contentMd, hashtags }),
          })
        )
      }

      await loadList()
      resetEditor()
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await jsonOrThrow<{ ok: true }>(await fetch(`/api/articles/${id}`, { method: 'DELETE' }))
      await loadList()
      if (editingId === id) {
        resetEditor()
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const insertAtCursor = (snippet: string) => {
    const textarea = textareaRef.current

    if (!textarea) {
      setContentMd(current => `${current}${current.length > 0 && !current.endsWith('\n') ? '\n\n' : ''}${snippet}\n\n`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = contentMd.slice(0, start)
    const after = contentMd.slice(end)
    const needsLeadingBreak = before.length > 0 && !before.endsWith('\n')
    const needsTrailingBreak = after.length > 0 && !after.startsWith('\n')
    const inserted = `${needsLeadingBreak ? '\n\n' : ''}${snippet}${needsTrailingBreak ? '\n\n' : ''}`

    setContentMd(`${before}${inserted}${after}`)

    queueMicrotask(() => {
      const caret = before.length + inserted.length
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/uploads/article-media', {
        method: 'POST',
        body: formData,
      })

      const data = await jsonOrThrow<{ markdown: string }>(res)
      insertAtCursor(data.markdown)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Ошибка загрузки файла'))
    } finally {
      setUploading(false)
    }
  }

  const addHashtag = (value: string) => {
    const formatted = formatHashtag(value)
    if (!formatted || hashtags.includes(formatted)) {
      setTagInput('')
      setTagSuggestions([])
      return
    }

    setHashtags(current => [...current, formatted])
    setTagInput('')
    setTagSuggestions([])
  }

  const removeHashtag = (value: string) => {
    setHashtags(current => current.filter(tag => tag !== value))
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="text-sm font-semibold text-gray-900">Статьи</div>
          {session?.user ? (
            <Button size="sm" onClick={startCreate} disabled={loading}>
              Создать
            </Button>
          ) : null}
        </div>

        <div className="border-b border-gray-200 px-4 py-3">
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="Поиск по статьям и хэштегам"
          />
        </div>

        <div className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-700">Пока нет статей.</div>
          ) : (
            items.map(item => {
              const isOwner = item.authorId === myUserId

              return (
                <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/articles/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-base font-medium text-gray-900 hover:text-blue-700 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {item.author?.name ?? 'Без имени'} · {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                    {item.hashtags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.hashtags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag)}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{item.preview}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ArticleLikeButton
                      articleId={item.id}
                      initialLikesCount={item.likesCount}
                      initialLikedByMe={item.likedByMe}
                    />
                    {isOwner ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item.id)}
                          disabled={loading}
                        >
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => remove(item.id)}
                          disabled={loading}
                        >
                          Удалить
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {!session?.user ? (
        <div className="text-xs text-gray-700">
          Создание статей и комментариев доступно только авторизованным пользователям.
        </div>
      ) : null}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {mode !== 'idle' ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">
              {mode === 'create' ? 'Создание статьи' : 'Редактирование статьи'}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={resetEditor} disabled={loading}>
                Отмена
              </Button>
              <Button size="sm" onClick={save} disabled={loading}>
                Сохранить
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              type="button"
            >
              {uploading ? 'Загрузка...' : 'Добавить файл'}
            </Button>
            <div className="text-xs text-gray-500">
              Поддерживаются изображения и видео до 25 МБ. В Markdown вставится ссылка автоматически.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2"
              placeholder="Заголовок"
            />
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={event => {
                    setTagInput(event.target.value)
                    loadTagSuggestions(event.target.value).catch(error => setError(getErrorMessage(error)))
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
                      event.preventDefault()
                      addHashtag(tagInput)
                    }
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  placeholder="Добавить хэштег, например #crypto"
                />
                <Button type="button" variant="outline" onClick={() => addHashtag(tagInput)}>
                  Добавить тег
                </Button>
              </div>
              {tagSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addHashtag(tag.hashtag)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {tag.hashtag}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <textarea
              ref={textareaRef}
              value={contentMd}
              onChange={event => setContentMd(event.target.value)}
              className="min-h-[420px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm"
              placeholder="Markdown..."
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
