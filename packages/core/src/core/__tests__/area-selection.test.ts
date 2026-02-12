import { describe, it, expect, beforeEach } from 'vitest'
import { findComponentsInArea, type SelectionRect } from '../area-selection'
import type { Fiber } from '../types'

function createMockFiber(options: Partial<Fiber> & { pendingProps?: Record<string, unknown> } = {}): Fiber {
  return {
    type: options.type ?? 'div',
    stateNode: options.stateNode ?? null,
    return: options.return ?? null,
    child: options.child ?? null,
    sibling: options.sibling ?? null,
    _debugSource: options._debugSource,
    _debugInfo: options._debugInfo,
    _debugOwner: options._debugOwner,
    pendingProps: options.pendingProps,
  }
}

describe('findComponentsInArea', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns empty array when no elements in area', () => {
    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const map = new WeakMap<HTMLElement, Fiber>()

    const result = findComponentsInArea(rect, map, true)
    expect(result).toEqual([])
  })

  it('finds components within selection area', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40 }),
    })

    function TestComponent() {}
    const fiber = createMockFiber({
      type: TestComponent,
      _debugSource: { fileName: 'src/Test.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(el, fiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('TestComponent')
    expect(result[0].source?.fileName).toBe('src/Test.tsx')
  })

  it('excludes elements outside selection area', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 200, top: 200, right: 300, bottom: 300, width: 100, height: 100 }),
    })

    function TestComponent() {}
    const fiber = createMockFiber({
      type: TestComponent,
      _debugSource: { fileName: 'src/Test.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(el, fiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(0)
  })

  it('builds parent-child relationships from fiber.return', () => {
    const parentEl = document.createElement('div')
    const childEl = document.createElement('span')
    parentEl.appendChild(childEl)
    document.body.appendChild(parentEl)

    for (const el of [parentEl, childEl]) {
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40 }),
      })
    }

    function ParentComp() {}
    function ChildComp() {}

    const parentFiber = createMockFiber({
      type: ParentComp,
      stateNode: parentEl,
      _debugSource: { fileName: 'src/Parent.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const childFiber = createMockFiber({
      type: ChildComp,
      stateNode: childEl,
      return: parentFiber,
      _debugSource: { fileName: 'src/Child.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(parentEl, parentFiber)
    map.set(childEl, childFiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('ParentComp')
    expect(result[0].children).toHaveLength(1)
    expect(result[0].children[0].name).toBe('ChildComp')
  })

  it('excludes zero-size elements', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 10, bottom: 10, width: 0, height: 0 }),
    })

    function TestComponent() {}
    const fiber = createMockFiber({
      type: TestComponent,
      _debugSource: { fileName: 'src/Test.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(el, fiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(0)
  })

  it('includes props from fiber.pendingProps', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40 }),
    })

    function TestComponent() {}
    const fiber = createMockFiber({
      type: TestComponent,
      _debugSource: { fileName: 'src/Test.tsx', lineNumber: 1, columnNumber: 0 },
      pendingProps: { label: 'hello', count: 5 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(el, fiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(1)
    expect(result[0].props).not.toBeNull()
    expect(result[0].props?.label).toBe('"hello"')
    expect(result[0].props?.count).toBe('5')
  })

  it('deduplicates fibers mapping to same user component', () => {
    const el1 = document.createElement('div')
    const el2 = document.createElement('span')
    document.body.appendChild(el1)
    document.body.appendChild(el2)

    for (const el of [el1, el2]) {
      Object.defineProperty(el, 'getBoundingClientRect', {
        value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40 }),
      })
    }

    function TestComponent() {}
    const fiber = createMockFiber({
      type: TestComponent,
      _debugSource: { fileName: 'src/Test.tsx', lineNumber: 1, columnNumber: 0 },
    })

    const map = new WeakMap<HTMLElement, Fiber>()
    map.set(el1, fiber)
    map.set(el2, fiber)

    const rect: SelectionRect = { left: 0, top: 0, right: 100, bottom: 100 }
    const result = findComponentsInArea(rect, map, true)

    expect(result).toHaveLength(1)
  })
})
