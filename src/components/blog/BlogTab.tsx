'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { MarkdownView } from '@/components/blog/MarkdownView'

type ArticleListItem = {
  id: string
  title: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: { name: string | null }
}

type Article = ArticleListItem & {
  contentMd: string
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Article | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view')

  const [title, setTitle] = useState('')
  const [contentMd, setContentMd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEditSelected = useMemo(() => {
    if (!selected || !myUserId) return false
    return selected.authorId === myUserId
  }, [selected, myUserId])

  const loadList = async () => {
    const res = await fetch('/api/articles', { cache: 'no-store' })
    const data = await jsonOrThrow<ArticleListItem[]>(res)
    setItems(data)
  }

  const loadOne = async (id: string) => {
    const res = await fetch(`/api/articles/${id}`, { cache: 'no-store' })
    const data = await jsonOrThrow<Article>(res)
    setSelected(data)
    setSelectedId(id)
  }

  useEffect(() => {
    loadList().catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    loadOne(selectedId).catch(e => setError(e.message))
  }, [selectedId])

  const startCreate = () => {
    setError(null)
    setMode('create')
    setSelectedId(null)
    setSelected(null)
    setTitle('Новая статья')
    setContentMd(`# Заголовок\n\nТекст в **Markdown**.\n\n- пункт 1\n- пункт 2\n`)
  }

  const startEdit = () => {
    if (!selected) return
    setError(null)
    setMode('edit')
    setTitle(selected.title)
    setContentMd(selected.contentMd)
  }

  const cancelEdit = () => {
    setError(null)
    setMode('view')
    if (selected) {
      setTitle(selected.title)
      setContentMd(selected.contentMd)
    } else {
      setTitle('')
      setContentMd('')
    }
  }

  const save = async () => {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'create') {
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, contentMd }),
        })
        const created = await jsonOrThrow<Article>(res)
        await loadList()
        setMode('view')
        setSelectedId(created.id)
      } else if (mode === 'edit' && selectedId) {
        const res = await fetch(`/api/articles/${selectedId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, contentMd }),
        })
        const updated = await jsonOrThrow<Article>(res)
        await loadList()
        setSelected(updated)
        setMode('view')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/articles/${selectedId}`, { method: 'DELETE' })
      await jsonOrThrow<{ ok: true }>(res)
      await loadList()
      setSelectedId(null)
      setSelected(null)
      setMode('view')
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const editorTitle = mode === 'create' ? 'Создание статьи' : mode === 'edit' ? 'Редактирование статьи' : 'Блог'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">Статьи</div>
          {session?.user ? (
            <Button size="sm" onClick={startCreate}>
              Создать
            </Button>
          ) : null}
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="max-h-[520px] overflow-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-gray-700">Пока нет статей.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {items.map(it => (
                  <li key={it.id}>
                    <button
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        it.id === selectedId ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => {
                        setMode('view')
                        setSelectedId(it.id)
                      }}
                    >
                      <div className="font-medium text-gray-900">{it.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {it.author?.name ?? 'Без имени'} · {new Date(it.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {!session?.user && (
          <div className="text-xs text-gray-700 mt-3">
            Создание доступно только авторизованным пользователям.
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900">{editorTitle}</div>
          <div className="flex items-center gap-2">
            {mode === 'view' && selected && canEditSelected ? (
              <>
                <Button size="sm" variant="outline" onClick={startEdit}>
                  Редактировать
                </Button>
                <Button size="sm" variant="outline" onClick={remove} disabled={loading}>
                  Удалить
                </Button>
              </>
            ) : null}
            {mode !== 'view' ? (
              <>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={loading}>
                  Отмена
                </Button>
                <Button size="sm" onClick={save} disabled={loading}>
                  Сохранить
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        ) : null}

        {mode === 'view' && !selected ? (
          <div className="border border-gray-200 rounded-md p-6 text-sm text-gray-700">
            Выберите статью слева или создайте новую.
          </div>
        ) : null}

        {mode !== 'view' ? (
          <div className="grid grid-cols-1 gap-4">
              <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white"
              placeholder="Заголовок"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <textarea
                value={contentMd}
                onChange={e => setContentMd(e.target.value)}
                className="w-full min-h-[360px] border border-gray-200 rounded-md px-3 py-2 font-mono text-sm bg-white"
                placeholder="Markdown..."
              />
              <div className="border border-gray-200 rounded-md p-3 bg-white min-h-[360px] overflow-auto">
                <MarkdownView value={contentMd} />
              </div>
            </div>
          </div>
        ) : null}

        {mode === 'view' && selected ? (
          <div className="border border-gray-200 rounded-md p-4 bg-white">
            <div className="text-2xl font-semibold text-gray-900">
              {selected.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selected.author?.name ?? 'Без имени'} · {new Date(selected.createdAt).toLocaleString()}
            </div>
            <div className="mt-4">
              <MarkdownView value={selected.contentMd} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

