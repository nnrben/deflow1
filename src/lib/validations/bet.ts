// src/lib/validations/bet.ts
import { z } from 'zod'

export const betSchema = z.object({
  outcome: z.boolean(),
  amount: z.number().int().positive(),
})

export type BetInput = z.infer<typeof betSchema>