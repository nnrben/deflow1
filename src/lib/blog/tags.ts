export function normalizeHashtag(value: string) {
  return value.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase()
}

export function formatHashtag(value: string) {
  const normalized = normalizeHashtag(value)
  return normalized ? `#${normalized}` : ''
}

export function uniqueHashtags(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const formatted = formatHashtag(value)
    if (!formatted || seen.has(formatted)) continue
    seen.add(formatted)
    result.push(formatted)
  }

  return result
}

export function stripMarkdownToPreview(markdown: string, maxLength = 250) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= maxLength) {
    return plain
  }

  return `${plain.slice(0, maxLength).trimEnd()}...`
}
