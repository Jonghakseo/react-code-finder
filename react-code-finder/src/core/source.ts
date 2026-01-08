import type { Fiber, SourceLocation } from './types'

export function getSourceFromFiber(fiber: Fiber): SourceLocation | null {
  // React 18 uses _debugSource, React 19 uses _debugInfo
  const source = fiber._debugSource ?? fiber._debugInfo
  if (source) {
    return source
  }

  if (fiber._debugOwner) {
    return getSourceFromFiber(fiber._debugOwner)
  }

  return null
}

export function getComponentName(fiber: Fiber): string {
  const name = getFiberTypeName(fiber)

  if (typeof fiber.type === 'string') {
    const ownerName = findOwnerComponentName(fiber)
    if (ownerName) {
      return ownerName
    }
  }

  return name
}

function getFiberTypeName(fiber: Fiber): string {
  const { type } = fiber

  if (typeof type === 'string') {
    return type
  }

  if (typeof type === 'function') {
    return (
      (type as { displayName?: string }).displayName || type.name || 'Anonymous'
    )
  }

  if (type && typeof type === 'object') {
    const obj = type as {
      displayName?: string
      render?: { displayName?: string; name?: string }
    }
    return (
      obj.displayName ||
      obj.render?.displayName ||
      obj.render?.name ||
      'Anonymous'
    )
  }

  return 'Unknown'
}

function findOwnerComponentName(fiber: Fiber): string | null {
  let current = fiber._debugOwner

  while (current) {
    if (typeof current.type === 'function') {
      const name = getFiberTypeName(current)
      if (name && name !== 'Anonymous' && name !== 'Unknown') {
        return name
      }
    }
    current = current._debugOwner
  }

  return null
}

export function findUserComponentFiber(fiber: Fiber): Fiber | null {
  let current: Fiber | null = fiber

  while (current) {
    // React 18 uses _debugSource, React 19 uses _debugInfo
    const source = current._debugSource ?? current._debugInfo
    if (source && !source.fileName.includes('node_modules')) {
      return current
    }
    current = current._debugOwner || current.return
  }

  return null
}

export function formatSourceLocation(source: SourceLocation): string {
  const { fileName, lineNumber, columnNumber } = source
  return `${fileName}:${lineNumber}:${columnNumber}`
}

export function getShortFileName(fileName: string): string {
  const parts = fileName.split('/')
  return parts[parts.length - 1] || fileName
}
