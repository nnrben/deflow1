// src/lib/validations/market.ts
import { z } from 'zod'

export const createMarketSchema = z.object({
  question: z.string().min(5).max(500),
  description: z.string().optional(),
  endDate: z.string().datetime(),
})

export type CreateMarketInput = z.infer<typeof createMarketSchema>