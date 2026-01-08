import type { Fiber, SourceLocation } from './types'

interface DebugOwner {
  name?: string
  env?: string
  stack?: Array<[string, string, number, number, number, number, boolean]>
  owner?: DebugOwner
  debugStack?: { stack?: string }
}

export function getSourceFromFiber(fiber: Fiber): SourceLocation | null {
  const source = getSourceFromDebugInfo(fiber)
  if (source) {
    return source
  }

  if (fiber._debugOwner) {
    return getSourceFromFiber(fiber._debugOwner)
  }

  return null
}

export function getComponentName(fiber: Fiber): string {
  // React 19 App Router: check _debugOwner.name first
  const debugOwnerName = getDebugOwnerName(fiber)
  if (debugOwnerName) {
    return debugOwnerName
  }

  const name = getFiberTypeName(fiber)

  if (typeof fiber.type === 'string') {
    const ownerName = findOwnerComponentName(fiber)
    if (ownerName) {
      return ownerName
    }
  }

  return name
}

function getDebugOwnerName(fiber: Fiber): string | null {
  const debugOwner = fiber._debugOwner as DebugOwner | Fiber | null
  if (debugOwner && 'name' in debugOwner && typeof debugOwner.name === 'string') {
    return debugOwner.name
  }
  return null
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

export function findUserComponentFiber(fiber: Fiber, skipAnonymous: boolean): Fiber | null {
  let current: Fiber | null = fiber

  while (current) {
    const name = getFiberTypeName(current)
    // Skip anonymous/unknown components if skipAnonymous is enabled
    if (skipAnonymous && (name === 'Anonymous' || name === 'Unknown')) {
      if (current._debugOwner && 'type' in current._debugOwner) {
        current = current._debugOwner as Fiber
      } else {
        current = current.return
      }
      continue
    }

    // First, try to find fiber with source info
    const source = getSourceFromDebugInfo(current)
    if (source && !source.fileName.includes('node_modules')) {
      return current
    }

    // Fallback: find user component by type name (for React 19 App Router)
    if (typeof current.type === 'function') {
      const typeName = current.type.displayName || current.type.name
      // Skip React internal components
      if (typeName && !typeName.startsWith('_')) {
        return current
      }
    }

    // React 19 App Router: _debugOwner is RSC DebugOwner (env === 'Server')
    const debugOwner = current._debugOwner as DebugOwner | Fiber | null
    if (debugOwner && 'env' in debugOwner && (debugOwner as DebugOwner).env === 'Server') {
      // This is a DebugOwner, not a Fiber - return current fiber with this debug info
      return current
    }

    // Move to parent fiber
    if (current._debugOwner && 'type' in current._debugOwner) {
      current = current._debugOwner as Fiber
    } else {
      current = current.return
    }
  }

  return null
}

function getSourceFromDebugInfo(fiber: Fiber): SourceLocation | null {
  // React 18: _debugSource is a SourceLocation object
  if (fiber._debugSource) {
    return fiber._debugSource
  }

  // React 19: _debugInfo can be a SourceLocation or an array
  const debugInfo = fiber._debugInfo
  if (debugInfo) {
    // If it's already a SourceLocation-like object
    if (typeof debugInfo === 'object' && 'fileName' in debugInfo) {
      return debugInfo as SourceLocation
    }

    // React 19 RSC: _debugInfo is an array of debug entries
    if (Array.isArray(debugInfo)) {
      for (const entry of debugInfo) {
        if (entry && typeof entry === 'object') {
          // Check for owner with env (RSC debug info)
          if ('owner' in entry && entry.owner) {
            const owner = entry.owner as { env?: string }
            if (owner.env) continue // Skip server components
          }
          // Check for direct fileName
          if ('fileName' in entry && entry.fileName) {
            return entry as SourceLocation
          }
        }
      }
    }
  }

  // React 19 App Router: _debugOwner contains stack info
  // Line numbers are not reliably provided in RSC, so we only extract fileName
  const debugOwner = fiber._debugOwner as DebugOwner | null
  if (debugOwner && debugOwner.stack && Array.isArray(debugOwner.stack)) {
    for (const stackEntry of debugOwner.stack) {
      if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
        const fileName = stackEntry[1]
        if (fileName && typeof fileName === 'string' && !fileName.includes('node_modules')) {
          return {
            fileName: fileName.replace('webpack-internal:///(rsc)/', '').replace('webpack-internal:///', ''),
            lineNumber: 0,
            columnNumber: 0,
          }
        }
      }
    }
  }

  return null
}

export function formatSourceLocation(source: SourceLocation): string {
  const { fileName, lineNumber, columnNumber } = source
  if (lineNumber === 0) {
    return fileName
  }
  return `${fileName}:${lineNumber}:${columnNumber}`
}

export function getShortFileName(fileName: string): string {
  const parts = fileName.split('/')
  return parts[parts.length - 1] || fileName
}

export interface ComponentStackItem {
  name: string
  source: SourceLocation | null
}

export function getComponentStack(fiber: Fiber, maxDepth: number, skipAnonymous: boolean): ComponentStackItem[] {
  const stack: ComponentStackItem[] = []
  const seenNames = new Set<string>()

  let current: Fiber | null = fiber
  const seenFibers = new Set<Fiber>()

  while (current && stack.length < maxDepth) {
    if (seenFibers.has(current)) break
    seenFibers.add(current)

    // Check if _debugOwner is a DebugOwner (RSC) or Fiber
    const debugOwner = current._debugOwner as DebugOwner | Fiber | null

    if (debugOwner && 'env' in debugOwner && (debugOwner as DebugOwner).env === 'Server') {
      // RSC DebugOwner: traverse owner chain and finish
      let currentOwner: DebugOwner | null = debugOwner as DebugOwner

      // Get fiber's _debugStack for parsing RSC source locations
      const fiberDebugStack = (current as Fiber & { _debugStack?: { stack?: string } })._debugStack?.stack

      while (currentOwner && stack.length < maxDepth) {
        const name = currentOwner.name || 'Unknown'
        const shouldSkip = skipAnonymous && (name === 'Unknown' || name === 'Anonymous')
        if (!shouldSkip && !seenNames.has(name)) {
          seenNames.add(name)
          let source = getSourceFromDebugOwner(currentOwner)
          // Fallback: parse from fiber's _debugStack
          if (!source && fiberDebugStack && name) {
            source = parseSourceFromDebugStack(fiberDebugStack, name)
          }
          stack.push({ name, source })
        }
        currentOwner = currentOwner.owner ?? null
      }
      break
    }

    // Client component: add to stack if has source
    const source = getSourceFromDebugInfo(current)
    if (source && !source.fileName.includes('node_modules')) {
      const name = getFiberTypeName(current)
      const shouldSkip = skipAnonymous && (name === 'Unknown' || name === 'Anonymous')
      if (!shouldSkip && !seenNames.has(name)) {
        seenNames.add(name)
        stack.push({ name, source })
      }
    }

    // Move to parent
    if (debugOwner && 'type' in debugOwner) {
      current = debugOwner as Fiber
    } else {
      current = current.return
    }
  }

  return stack
}

function parseSourceFromDebugStack(stackStr: string, componentName: string): SourceLocation | null {
  // Pattern: at ComponentName (about://React/Server/webpack-internal:///(rsc)/./path/to/file.tsx?11:79:88)
  const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`at ${escapedName} \\(about://React/Server/webpack-internal:///\\(rsc\\)/[^\\n]+`)
  const match = stackStr.match(pattern)
  if (match) {
    const fileMatch = match[0].match(/webpack-internal:\/\/\/\(rsc\)\/\.?([^?\s:]+)/)
    if (fileMatch) {
      return {
        fileName: fileMatch[1],
        lineNumber: 0,
        columnNumber: 0,
      }
    }
  }
  return null
}

function getSourceFromDebugOwner(owner: DebugOwner): SourceLocation | null {
  // Try stack array first (skip if empty or first entry is "Function.all")
  if (owner.stack && Array.isArray(owner.stack) && owner.stack.length > 0) {
    const firstEntry = owner.stack[0]
    if (Array.isArray(firstEntry) && firstEntry[0] !== 'Function.all') {
      for (const stackEntry of owner.stack) {
        if (Array.isArray(stackEntry) && stackEntry.length >= 2) {
          const fileName = stackEntry[1]
          if (fileName && typeof fileName === 'string' && !fileName.includes('node_modules')) {
            return {
              fileName: fileName.replace('webpack-internal:///(rsc)/', '').replace('webpack-internal:///', ''),
              lineNumber: 0,
              columnNumber: 0,
            }
          }
        }
      }
    }
  }

  // Fallback: parse debugStack.stack error string
  if (owner.debugStack?.stack && owner.name) {
    const stackStr = owner.debugStack.stack
    // Pattern: at ComponentName (about://React/Server/webpack-internal:///(rsc)/./path/to/file.tsx?...)
    const pattern = new RegExp(`at ${owner.name} \\(about://React/Server/webpack-internal://[^)]+\\)`)
    const match = stackStr.match(pattern)
    if (match) {
      const fileMatch = match[0].match(/webpack-internal:\/\/\/\(rsc\)\/([^?:]+)/)
      if (fileMatch) {
        return {
          fileName: fileMatch[1],
          lineNumber: 0,
          columnNumber: 0,
        }
      }
    }
  }

  return null
}

export function formatComponentStack(stack: ComponentStackItem[]): string {
  if (stack.length === 0) return ''

  return stack
    .map((item, index) => {
      const prefix = index === 0 ? '' : '  '.repeat(index) + '← '
      if (item.source) {
        return `${prefix}${item.name} (${formatSourceLocation(item.source)})`
      }
      return `${prefix}${item.name}`
    })
    .join('\n')
}
