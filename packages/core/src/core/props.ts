export type SerializedProps = Record<string, string>

export function serializeProps(
  props: Record<string, unknown> | undefined,
  maxValueLength: number = 100
): SerializedProps | null {
  if (!props) return null

  const result: SerializedProps = {}
  const seen = new WeakSet()

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    if (key.startsWith('__')) continue
    result[key] = serializeValue(value, seen, maxValueLength, 0)
  }

  return Object.keys(result).length > 0 ? result : null
}

function serializeValue(
  value: unknown,
  seen: WeakSet<object>,
  maxLength: number,
  depth: number
): string {
  if (depth > 3) return '[...]'

  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return truncate(`"${value}"`, maxLength)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'function') return '[Function]'
  if (typeof value === 'symbol') return value.toString()

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]'
    seen.add(value)

    if (value && '$$typeof' in value) return '[ReactElement]'

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]'
      const items = value
        .slice(0, 5)
        .map((v) => serializeValue(v, seen, maxLength, depth + 1))
      const suffix = value.length > 5 ? `, ...(${value.length})` : ''
      return truncate(`[${items.join(', ')}${suffix}]`, maxLength)
    }

    const entries = Object.entries(value).slice(0, 5)
    if (entries.length === 0) return '{}'
    const items = entries.map(
      ([k, v]) => `${k}: ${serializeValue(v, seen, maxLength, depth + 1)}`
    )
    const suffix = Object.keys(value).length > 5 ? ', ...' : ''
    return truncate(`{ ${items.join(', ')}${suffix} }`, maxLength)
  }

  return String(value)
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function formatProps(props: SerializedProps): string {
  return Object.entries(props)
    .map(([key, value]) => `${key}={${value}}`)
    .join(', ')
}
