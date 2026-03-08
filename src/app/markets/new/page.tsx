'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const marketSchema = z.object({
  question: z.string().min(5).max(500),
  description: z.string().optional(),
  endDate: z.string().min(1, 'End date is required'),
})

type MarketFormData = z.infer<typeof marketSchema>

export default function NewMarketPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
  })

  const onSubmit = async (data: MarketFormData) => {
    const localDate = new Date(data.endDate)
    if (isNaN(localDate.getTime())) {
      alert('Некорректная дата')
      return
    }
    const isoEndDate = localDate.toISOString()

    const payload = {
      question: data.question,
      description: data.description,
      endDate: isoEndDate,
    }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      router.push('/markets')
    } else {
      const errorData = await res.json()
      const errorMessage = Array.isArray(errorData.error)
        ? errorData.error.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        : errorData.error || 'Ошибка при создании рынка'
      alert(errorMessage)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Создать новый рынок</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Вопрос</label>
          <Input {...register('question')} />
          {errors.question && <p className="text-red-500 text-sm">{errors.question.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Описание (необязательно)</label>
          <textarea {...register('description')} className="w-full border rounded-md p-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Дата окончания</label>
          <Input type="datetime-local" {...register('endDate')} />
          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Создание...' : 'Создать рынок'}
        </Button>
      </form>
    </div>
  )
}