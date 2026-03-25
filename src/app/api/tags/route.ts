import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeHashtag } from '@/lib/blog/tags'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') ?? ''
  const normalized = normalizeHashtag(query)

  const tags = await prisma.tag.findMany({
    where: normalized
      ? {
          OR: [
            { normalizedName: { contains: normalized, mode: 'insensitive' } },
            { name: { contains: normalized, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      normalizedName: true,
    },
    orderBy: [{ name: 'asc' }],
    take: 8,
  })

  return NextResponse.json(
    tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      hashtag: `#${tag.normalizedName}`,
    }))
  )
}
