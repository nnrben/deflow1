import { z } from 'zod'

export const createArticleSchema = z.object({
  title: z.string().min(3).max(200),
  contentMd: z.string().min(1).max(200_000),
  hashtags: z.array(z.string().min(2).max(50)).max(20).default([]),
})

export const updateArticleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  contentMd: z.string().min(1).max(200_000).optional(),
  hashtags: z.array(z.string().min(2).max(50)).max(20).optional(),
})

export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>
