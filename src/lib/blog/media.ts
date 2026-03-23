const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.m4v']

export function isImagePath(path: string) {
  const normalized = path.toLowerCase()
  return IMAGE_EXTENSIONS.some(extension => normalized.endsWith(extension))
}

export function isVideoPath(path: string) {
  const normalized = path.toLowerCase()
  return VIDEO_EXTENSIONS.some(extension => normalized.endsWith(extension))
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
