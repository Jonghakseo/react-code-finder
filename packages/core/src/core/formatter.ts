import type { ComponentStackItem } from './source'
import type { ComponentTreeNode } from './area-selection'
import type { SourceSnippet } from '../client/source-fetcher'
import { formatSourceLocation } from './source'
import { formatProps } from './props'
import { toRelativePath } from './path'

export type OutputFormat = 'xml' | 'plain'

export function formatOutput(
  stack: ComponentStackItem[],
  sources: Map<string, SourceSnippet>,
  format: OutputFormat = 'xml'
): string {
  if (format === 'plain') {
    return formatPlainOutput(stack, sources)
  }
  return formatXmlOutput(stack, sources)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatXmlOutput(
  stack: ComponentStackItem[],
  sources: Map<string, SourceSnippet>
): string {
  if (stack.length === 0) return ''

  const [primary, ...parents] = stack
  const lines: string[] = []

  const primaryAttrs: string[] = [`name="${escapeXml(primary.name)}"`]
  if (primary.source) {
    primaryAttrs.push(`file="${escapeXml(toRelativePath(primary.source.fileName))}"`)
    if (primary.source.lineNumber > 0) {
      primaryAttrs.push(`line="${primary.source.lineNumber}"`)
    }
  }
  lines.push(`<component ${primaryAttrs.join(' ')}>`)

  if (primary.props) {
    lines.push(`  <props>${escapeXml(formatProps(primary.props))}</props>`)
  }

  const primarySource = primary.source ? sources.get(primary.source.fileName) : null
  if (primarySource) {
    lines.push(
      `  <source file="${escapeXml(toRelativePath(primary.source!.fileName))}" lines="${primarySource.startLine}-${primarySource.endLine}">`
    )
    lines.push(primarySource.content)
    lines.push('  </source>')
  }

  for (const parent of parents) {
    const attrs: string[] = [`name="${escapeXml(parent.name)}"`]
    if (parent.source) {
      attrs.push(`file="${escapeXml(toRelativePath(parent.source.fileName))}"`)
      if (parent.source.lineNumber > 0) {
        attrs.push(`line="${parent.source.lineNumber}"`)
      }
    }
    if (parent.props) {
      attrs.push(`props="${escapeXml(formatProps(parent.props))}"`)
    }
    lines.push(`  <parent ${attrs.join(' ')} />`)
  }

  lines.push('</component>')
  return lines.join('\n')
}

function formatPlainOutput(
  stack: ComponentStackItem[],
  sources: Map<string, SourceSnippet>
): string {
  const stackText = stack
    .map((item, index) => {
      const prefix = index === 0 ? '' : '  '.repeat(index) + '\u2190 '
      const propsStr = item.props ? ` ${formatProps(item.props)}` : ''
      if (item.source) {
        return `${prefix}${item.name}${propsStr} (${formatSourceLocation(item.source)})`
      }
      return `${prefix}${item.name}${propsStr}`
    })
    .join('\n')

  const primary = stack[0]
  const primarySource = primary?.source ? sources.get(primary.source.fileName) : null
  if (!primarySource) return stackText

  return stackText + `\n\n--- ${toRelativePath(primary.source!.fileName)} (lines ${primarySource.startLine}-${primarySource.endLine}) ---\n${primarySource.content}`
}

export function formatComponentTree(
  tree: ComponentTreeNode[],
  sources: Map<string, SourceSnippet>,
  format: OutputFormat = 'xml'
): string {
  if (format === 'plain') {
    return formatTreePlain(tree, sources, 0)
  }
  return formatTreeXml(tree, sources, 0)
}

function formatTreeXml(
  nodes: ComponentTreeNode[],
  sources: Map<string, SourceSnippet>,
  indent: number
): string {
  const pad = '  '.repeat(indent)

  return nodes
    .map((node) => {
      const attrs: string[] = [`name="${escapeXml(node.name)}"`]
      if (node.source) {
        attrs.push(`file="${escapeXml(toRelativePath(node.source.fileName))}"`)
        if (node.source.lineNumber > 0) {
          attrs.push(`line="${node.source.lineNumber}"`)
        }
      }

      const hasContent = node.props || node.children.length > 0 || (node.source && sources.has(node.source.fileName))

      if (!hasContent) {
        return `${pad}<component ${attrs.join(' ')} />`
      }

      const lines: string[] = [`${pad}<component ${attrs.join(' ')}>`]

      if (node.props) {
        lines.push(`${pad}  <props>${escapeXml(formatProps(node.props))}</props>`)
      }

      const sourceSnippet = node.source ? sources.get(node.source.fileName) : null
      if (sourceSnippet) {
        lines.push(
          `${pad}  <source file="${escapeXml(toRelativePath(node.source!.fileName))}" lines="${sourceSnippet.startLine}-${sourceSnippet.endLine}">`
        )
        lines.push(sourceSnippet.content)
        lines.push(`${pad}  </source>`)
      }

      if (node.children.length > 0) {
        lines.push(formatTreeXml(node.children, sources, indent + 1))
      }

      lines.push(`${pad}</component>`)
      return lines.join('\n')
    })
    .join('\n')
}

function formatTreePlain(
  nodes: ComponentTreeNode[],
  sources: Map<string, SourceSnippet>,
  depth: number
): string {
  return nodes
    .map((node) => {
      const indentStr = '  '.repeat(depth)
      const propsStr = node.props ? ` ${formatProps(node.props)}` : ''
      const sourceStr = node.source
        ? ` (${formatSourceLocation(node.source)})`
        : ''
      const line = `${indentStr}${node.name}${propsStr}${sourceStr}`
      const childLines =
        node.children.length > 0
          ? '\n' + formatTreePlain(node.children, sources, depth + 1)
          : ''
      return line + childLines
    })
    .join('\n')
}
