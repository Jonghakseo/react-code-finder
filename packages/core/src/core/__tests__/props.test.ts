import { describe, it, expect } from 'vitest'
import { serializeProps, formatProps } from '../props'

describe('serializeProps', () => {
  it('returns null for undefined props', () => {
    expect(serializeProps(undefined)).toBeNull()
  })

  it('returns null for empty props after filtering', () => {
    expect(serializeProps({ children: 'text' })).toBeNull()
  })

  it('serializes string values with quotes', () => {
    const result = serializeProps({ name: 'hello' })
    expect(result).toEqual({ name: '"hello"' })
  })

  it('serializes number values', () => {
    const result = serializeProps({ count: 42 })
    expect(result).toEqual({ count: '42' })
  })

  it('serializes boolean values', () => {
    const result = serializeProps({ active: true, disabled: false })
    expect(result).toEqual({ active: 'true', disabled: 'false' })
  })

  it('serializes null and undefined values', () => {
    const result = serializeProps({ a: null, b: undefined })
    expect(result).toEqual({ a: 'null', b: 'undefined' })
  })

  it('serializes functions as [Function]', () => {
    const result = serializeProps({ onClick: () => {} })
    expect(result).toEqual({ onClick: '[Function]' })
  })

  it('serializes symbols', () => {
    const result = serializeProps({ key: Symbol('test') })
    expect(result?.key).toBe('Symbol(test)')
  })

  it('skips children prop', () => {
    const result = serializeProps({ children: 'text', className: 'btn' })
    expect(result).toEqual({ className: '"btn"' })
    expect(result).not.toHaveProperty('children')
  })

  it('skips props starting with __', () => {
    const result = serializeProps({ __internal: true, visible: true })
    expect(result).toEqual({ visible: 'true' })
    expect(result).not.toHaveProperty('__internal')
  })

  it('detects React elements via $$typeof', () => {
    const element = { $$typeof: Symbol.for('react.element'), type: 'div' }
    const result = serializeProps({ icon: element })
    expect(result).toEqual({ icon: '[ReactElement]' })
  })

  it('handles circular references', () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    const result = serializeProps({ data: obj })
    expect(result?.data).toContain('[Circular]')
  })

  it('serializes arrays', () => {
    const result = serializeProps({ items: [1, 2, 3] })
    expect(result?.items).toBe('[1, 2, 3]')
  })

  it('truncates long arrays', () => {
    const result = serializeProps({ items: [1, 2, 3, 4, 5, 6, 7] })
    expect(result?.items).toContain('...(7)')
  })

  it('serializes empty arrays', () => {
    const result = serializeProps({ items: [] })
    expect(result?.items).toBe('[]')
  })

  it('serializes objects', () => {
    const result = serializeProps({ style: { color: 'red' } })
    expect(result?.style).toContain('color')
    expect(result?.style).toContain('"red"')
  })

  it('serializes empty objects', () => {
    const result = serializeProps({ data: {} })
    expect(result?.data).toBe('{}')
  })

  it('limits depth to 3', () => {
    const deep = { a: { b: { c: { d: 'too deep' } } } }
    const result = serializeProps({ data: deep })
    expect(result?.data).toContain('[...]')
  })

  it('truncates long string values', () => {
    const longStr = 'a'.repeat(200)
    const result = serializeProps({ text: longStr }, 50)
    expect(result?.text.length).toBeLessThanOrEqual(50)
    expect(result?.text).toContain('...')
  })
})

describe('formatProps', () => {
  it('formats single prop', () => {
    expect(formatProps({ name: '"hello"' })).toBe('name={"hello"}')
  })

  it('formats multiple props', () => {
    const result = formatProps({ a: '1', b: '"two"' })
    expect(result).toBe('a={1}, b={"two"}')
  })

  it('formats empty props object', () => {
    expect(formatProps({})).toBe('')
  })
})
