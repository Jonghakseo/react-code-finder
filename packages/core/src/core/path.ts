function getProjectRoot(): string {
  if (typeof window !== 'undefined') {
    return (window as Window & { __RCF_PROJECT_ROOT__?: string }).__RCF_PROJECT_ROOT__ || ''
  }
  return ''
}

export function toRelativePath(filePath: string): string {
  const root = getProjectRoot()
  if (!root || !filePath.startsWith(root)) {
    return filePath
  }
  const relative = filePath.slice(root.length)
  return relative.startsWith('/') ? relative.slice(1) : relative
}
