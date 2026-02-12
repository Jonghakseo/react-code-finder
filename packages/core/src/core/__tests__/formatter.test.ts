import { describe, it, expect } from 'vitest'
import { formatOutput, formatComponentTree, type OutputFormat } from '../formatter'
import type { ComponentStackItem } from '../source'
import type { SourceSnippet } from '../../client/source-fetcher'
import type { ComponentTreeNode } from '../area-selection'

function createStackItem(
  name: string,
  fileName: string | null = null,
  line = 10,
  props: Record<string, string> | null = null
): ComponentStackItem {
  return {
    name,
    source: fileName ? { fileName, lineNumber: line, columnNumber: 5 } : null,
    props,
  }
}

function createSnippet(file: string, content: string): SourceSnippet {
  return { file, startLine: 1, endLine: 10, content }
}

describe('formatOutput - XML', () => {
  it('returns empty string for empty stack', () => {
    expect(formatOutput([], new Map(), 'xml')).toBe('')
  })

  it('formats single component with source', () => {
    const stack = [createStackItem('Button', 'src/Button.tsx', 42)]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('<component name="Button"')
    expect(result).toContain('file="src/Button.tsx"')
    expect(result).toContain('line="42"')
    expect(result).toContain('</component>')
  })

  it('includes props in XML output', () => {
    const stack = [createStackItem('Button', 'src/Button.tsx', 42, { variant: '"primary"' })]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('<props>')
    expect(result).toContain('variant={"primary"}')
    expect(result).toContain('</props>')
  })

  it('includes source code snippet', () => {
    const stack = [createStackItem('Button', 'src/Button.tsx', 42)]
    const sources = new Map([['src/Button.tsx', createSnippet('src/Button.tsx', 'function Button() {}')]])
    const result = formatOutput(stack, sources, 'xml')

    expect(result).toContain('<source file="src/Button.tsx"')
    expect(result).toContain('function Button() {}')
    expect(result).toContain('</source>')
  })

  it('formats parent components', () => {
    const stack = [
      createStackItem('Button', 'src/Button.tsx', 42),
      createStackItem('Card', 'src/Card.tsx', 20),
    ]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('<component name="Button"')
    expect(result).toContain('<parent name="Card"')
  })

  it('formats parent without source even when source is available', () => {
    const stack = [
      createStackItem('Button', 'src/Button.tsx', 42),
      createStackItem('Card', 'src/Card.tsx', 20),
    ]
    const sources = new Map([['src/Card.tsx', createSnippet('src/Card.tsx', 'function Card() {}')]])
    const result = formatOutput(stack, sources, 'xml')

    expect(result).toContain('<parent name="Card"')
    expect(result).toContain('/>')
    expect(result).not.toContain('function Card() {}')
    expect(result).not.toContain('</parent>')
  })

  it('formats parent without source as self-closing tag', () => {
    const stack = [
      createStackItem('Button', 'src/Button.tsx', 42),
      createStackItem('Card', 'src/Card.tsx', 20),
    ]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('<parent name="Card"')
    expect(result).toContain('/>')
  })

  it('escapes XML special characters in names', () => {
    const stack = [createStackItem('A<B>', 'src/A.tsx')]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('name="A&lt;B&gt;"')
  })

  it('omits lineNumber when 0', () => {
    const stack = [{
      name: 'Server',
      source: { fileName: 'src/Server.tsx', lineNumber: 0, columnNumber: 0 },
      props: null,
    }]
    const result = formatOutput(stack, new Map(), 'xml')

    expect(result).toContain('file="src/Server.tsx"')
    expect(result).not.toContain('line="0"')
  })
})

describe('formatOutput - plain', () => {
  it('formats plain text with arrows', () => {
    const stack = [
      createStackItem('Child', 'src/Child.tsx', 5),
      createStackItem('Parent', 'src/Parent.tsx', 10),
    ]
    const result = formatOutput(stack, new Map(), 'plain')

    expect(result).toContain('Child')
    expect(result).toContain('← Parent')
  })

  it('includes props in plain text', () => {
    const stack = [createStackItem('Button', 'src/Button.tsx', 42, { size: '"lg"' })]
    const result = formatOutput(stack, new Map(), 'plain')

    expect(result).toContain('size={"lg"}')
  })

  it('appends source code in plain text', () => {
    const stack = [createStackItem('Button', 'src/Button.tsx', 42)]
    const sources = new Map([['src/Button.tsx', createSnippet('src/Button.tsx', 'function Button() {}')]])
    const result = formatOutput(stack, sources, 'plain')

    expect(result).toContain('--- src/Button.tsx')
    expect(result).toContain('function Button() {}')
  })

  it('defaults to xml format', () => {
    const stack = [createStackItem('App', 'src/App.tsx')]
    const result = formatOutput(stack, new Map())

    expect(result).toContain('<component')
  })
})

describe('formatComponentTree - XML', () => {
  it('formats single root node without content as self-closing', () => {
    const tree: ComponentTreeNode[] = [{
      name: 'App',
      source: { fileName: 'src/App.tsx', lineNumber: 1, columnNumber: 0 },
      props: null,
      children: [],
    }]
    const result = formatComponentTree(tree, new Map(), 'xml')

    expect(result).toContain('<component name="App"')
    expect(result).toContain('/>')
  })

  it('formats single root node with props as open/close tags', () => {
    const tree: ComponentTreeNode[] = [{
      name: 'App',
      source: { fileName: 'src/App.tsx', lineNumber: 1, columnNumber: 0 },
      props: { title: '"Home"' },
      children: [],
    }]
    const result = formatComponentTree(tree, new Map(), 'xml')

    expect(result).toContain('<component name="App"')
    expect(result).toContain('</component>')
    expect(result).toContain('<props>')
  })

  it('formats nested children with indentation', () => {
    const tree: ComponentTreeNode[] = [{
      name: 'App',
      source: { fileName: 'src/App.tsx', lineNumber: 1, columnNumber: 0 },
      props: null,
      children: [{
        name: 'Button',
        source: { fileName: 'src/Button.tsx', lineNumber: 5, columnNumber: 0 },
        props: { label: '"Click"' },
        children: [],
      }],
    }]
    const result = formatComponentTree(tree, new Map(), 'xml')

    expect(result).toContain('<component name="App"')
    expect(result).toContain('  <component name="Button"')
    expect(result).toContain('    <props>')
  })

  it('self-closes empty leaf nodes without props or source', () => {
    const tree: ComponentTreeNode[] = [{
      name: 'Icon',
      source: { fileName: 'src/Icon.tsx', lineNumber: 1, columnNumber: 0 },
      props: null,
      children: [],
    }]
    const result = formatComponentTree(tree, new Map(), 'xml')

    expect(result).toContain('<component name="Icon"')
    expect(result).toContain('/>')
  })

  it('formats multiple root nodes', () => {
    const tree: ComponentTreeNode[] = [
      { name: 'Header', source: null, props: null, children: [] },
      { name: 'Footer', source: null, props: null, children: [] },
    ]
    const result = formatComponentTree(tree, new Map(), 'xml')

    expect(result).toContain('name="Header"')
    expect(result).toContain('name="Footer"')
  })
})

describe('formatComponentTree - plain', () => {
  it('formats tree with indentation', () => {
    const tree: ComponentTreeNode[] = [{
      name: 'App',
      source: { fileName: 'src/App.tsx', lineNumber: 1, columnNumber: 0 },
      props: null,
      children: [{
        name: 'Button',
        source: { fileName: 'src/Button.tsx', lineNumber: 5, columnNumber: 0 },
        props: null,
        children: [],
      }],
    }]
    const result = formatComponentTree(tree, new Map(), 'plain')

    expect(result).toContain('App (src/App.tsx:1:0)')
    expect(result).toContain('  Button (src/Button.tsx:5:0)')
  })
})
