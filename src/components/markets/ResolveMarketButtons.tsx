// src/components/markets/ResolveMarketButtons.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function ResolveMarketButtons({ marketId }: { marketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleResolve = async (outcome: boolean) => {
    if (loading) return
    setLoading(true)
    const res = await fetch(`/api/markets/${marketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка при разрешении рынка')
    }
  }

  return (
    <div className="flex gap-4">
      <Button onClick={() => handleResolve(true)} disabled={loading}>
        Правильный исход: ДА
      </Button>
      <Button onClick={() => handleResolve(false)} disabled={loading} variant="outline">
        Правильный исход: НЕТ
      </Button>
    </div>
  )
}
