const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v']

export type ArticleMediaType = 'image' | 'video'

export function isImagePath(path: string) {
  const normalized = path.toLowerCase()
  return IMAGE_EXTENSIONS.some(extension => normalized.endsWith(extension))
}

export function isVideoPath(path: string) {
  const normalized = path.toLowerCase()
  return VIDEO_EXTENSIONS.some(extension => normalized.endsWith(extension))
}

export function extractFirstMediaFromMarkdown(
  markdown: string
): { url: string; kind: ArticleMediaType } | null {
  const imageMatch = markdown.match(/!\[[^\]]*]\(([^)]+)\)/i)
  if (imageMatch?.[1]) {
    return { url: imageMatch[1], kind: 'image' }
  }

  const linkMatch = markdown.match(/\[[^\]]*]\(([^)]+)\)/i)
  if (linkMatch?.[1]) {
    const url = linkMatch[1]
    if (isImagePath(url)) return { url, kind: 'image' }
    if (isVideoPath(url)) return { url, kind: 'video' }
  }

  const rawUrlMatch = markdown.match(/https?:\/\/[^\s)]+/i)
  if (rawUrlMatch?.[0]) {
    const url = rawUrlMatch[0]
    if (isImagePath(url)) return { url, kind: 'image' }
    if (isVideoPath(url)) return { url, kind: 'video' }
  }

  return null
}

export function stripMarkdownToPreview(markdown: string, limit = 250) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, ' ')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}…`
}

export function buildArticleMediaMarkdown(fileName: string, fileUrl: string) {
  if (isImagePath(fileUrl)) {
    return `![${fileName}](${fileUrl})`
  }
  if (isVideoPath(fileUrl)) {
    return `[${fileName}](${fileUrl})`
  }
  return `[${fileName}](${fileUrl})`
}