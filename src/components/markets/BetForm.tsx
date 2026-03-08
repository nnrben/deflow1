// src/components/markets/BetForm.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface BetFormProps {
  marketId: string
  marketEndDate: string
}

export default function BetForm({ marketId, marketEndDate }: BetFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [outcome, setOutcome] = useState<boolean | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      router.push('/api/auth/signin')
      return
    }
    if (outcome === null || !amount) return

    setLoading(true)
    const res = await fetch(`/api/markets/${marketId}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, amount: parseInt(amount) }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка при размещении ставки')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold">Сделать ставку</h3>
      <div className="flex gap-4">
        <Button
          type="button"
          variant={outcome === true ? 'default' : 'outline'}
          onClick={() => setOutcome(true)}
          className="flex-1"
        >
          Да
        </Button>
        <Button
          type="button"
          variant={outcome === false ? 'default' : 'outline'}
          onClick={() => setOutcome(false)}
          className="flex-1"
        >
          Нет
        </Button>
      </div>
      <div>
        <label className="block text-sm mb-1">Сумма (кредиты)</label>
        <Input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading || outcome === null || !amount}>
        {loading ? 'Обработка...' : 'Поставить'}
      </Button>
    </form>
  )
}
