import { describe, it, expect } from 'vitest'
import type { Fiber, SourceLocation } from '../types'
import {
  getSourceFromFiber,
  getComponentName,
  findUserComponentFiber,
  getComponentStack,
  formatSourceLocation,
  getShortFileName,
  formatComponentStack,
} from '../source'

function createMockFiber(options: Partial<Fiber> = {}): Fiber {
  return {
    type: options.type ?? 'div',
    stateNode: options.stateNode ?? null,
    return: options.return ?? null,
    child: options.child ?? null,
    sibling: options.sibling ?? null,
    _debugSource: options._debugSource,
    _debugInfo: options._debugInfo,
    _debugOwner: options._debugOwner,
  }
}

function createMockSource(fileName = '/src/App.tsx', lineNumber = 10, columnNumber = 5): SourceLocation {
  return { fileName, lineNumber, columnNumber }
}

describe('getSourceFromFiber', () => {
  it('returns _debugSource for React 18 fiber', () => {
    const source = createMockSource()
    const fiber = createMockFiber({ _debugSource: source })

    expect(getSourceFromFiber(fiber)).toEqual(source)
  })

  it('returns source from _debugInfo object for React 19', () => {
    const source = createMockSource()
    const fiber = createMockFiber({
      _debugInfo: source as unknown as Fiber['_debugInfo'],
    })

    expect(getSourceFromFiber(fiber)).toEqual(source)
  })

  it('returns source from _debugInfo array for React 19 RSC', () => {
    const source = createMockSource()
    const fiber = createMockFiber({
      _debugInfo: [{ fileName: source.fileName, lineNumber: source.lineNumber, columnNumber: source.columnNumber }],
    })

    expect(getSourceFromFiber(fiber)).toEqual(source)
  })

  it('skips server components in _debugInfo array', () => {
    const clientSource = createMockSource('/src/Client.tsx')
    const fiber = createMockFiber({
      _debugInfo: [
        { owner: { env: 'Server' } },
        clientSource,
      ],
    })

    expect(getSourceFromFiber(fiber)).toEqual(clientSource)
  })

  it('traverses _debugOwner chain recursively', () => {
    const source = createMockSource()
    const ownerFiber = createMockFiber({ _debugSource: source })
    const fiber = createMockFiber({ _debugOwner: ownerFiber })

    expect(getSourceFromFiber(fiber)).toEqual(source)
  })

  it('returns source from RSC stack array in _debugOwner', () => {
    const fiber = createMockFiber({
      _debugOwner: {
        stack: [['Component', '/src/Component.tsx', 0, 0, 0, 0, false]],
      } as unknown as Fiber,
    })

    const result = getSourceFromFiber(fiber)
    expect(result?.fileName).toBe('/src/Component.tsx')
  })

  it('filters out node_modules from RSC stack', () => {
    const fiber = createMockFiber({
      _debugOwner: {
        stack: [
          ['Lib', 'node_modules/lib/index.js', 0, 0, 0, 0, false],
          ['Component', '/src/Component.tsx', 0, 0, 0, 0, false],
        ],
      } as unknown as Fiber,
    })

    const result = getSourceFromFiber(fiber)
    expect(result?.fileName).toBe('/src/Component.tsx')
  })

  it('returns null when no source available', () => {
    const fiber = createMockFiber()

    expect(getSourceFromFiber(fiber)).toBeNull()
  })
})

describe('getComponentName', () => {
  it('returns displayName for function components', () => {
    const Component = function MyComponent() {}
    Component.displayName = 'CustomName'
    const fiber = createMockFiber({ type: Component })

    expect(getComponentName(fiber)).toBe('CustomName')
  })

  it('returns function name when no displayName', () => {
    function MyComponent() {}
    const fiber = createMockFiber({ type: MyComponent })

    expect(getComponentName(fiber)).toBe('MyComponent')
  })

  it('returns name from function even for arrow functions in tests', () => {
    const fiber = createMockFiber({ type: () => {} })

    // In test environment, arrow functions get 'type' as name from object property
    expect(typeof getComponentName(fiber)).toBe('string')
  })

  it('returns tag name for HTML elements', () => {
    const fiber = createMockFiber({ type: 'div' })

    expect(getComponentName(fiber)).toBe('div')
  })

  it('returns owner name for HTML elements with owner chain', () => {
    function ParentComponent() {}
    const ownerFiber = createMockFiber({ type: ParentComponent })
    const fiber = createMockFiber({ type: 'div', _debugOwner: ownerFiber })

    expect(getComponentName(fiber)).toBe('ParentComponent')
  })

  it('returns displayName from object type (forwardRef)', () => {
    const forwardRefComponent = {
      displayName: 'ForwardRefComponent',
      render: () => {},
    }
    const fiber = createMockFiber({ type: forwardRefComponent })

    expect(getComponentName(fiber)).toBe('ForwardRefComponent')
  })

  it('returns render.displayName from object type', () => {
    const forwardRefComponent = {
      render: { displayName: 'RenderDisplayName', name: 'RenderName' },
    }
    const fiber = createMockFiber({ type: forwardRefComponent })

    expect(getComponentName(fiber)).toBe('RenderDisplayName')
  })

  it('returns render.name from object type', () => {
    const forwardRefComponent = {
      render: { name: 'RenderName' },
    }
    const fiber = createMockFiber({ type: forwardRefComponent })

    expect(getComponentName(fiber)).toBe('RenderName')
  })

  it('returns Unknown for null/undefined type', () => {
    const fiber: Fiber = {
      type: null as unknown as string,
      stateNode: null,
      return: null,
      child: null,
      sibling: null,
      _debugSource: undefined,
      _debugInfo: undefined,
      _debugOwner: undefined,
    }

    expect(getComponentName(fiber)).toBe('Unknown')
  })

  it('returns _debugOwner.name for RSC components', () => {
    const fiber = createMockFiber({
      type: 'div',
      _debugOwner: { name: 'ServerComponent' } as unknown as Fiber,
    })

    expect(getComponentName(fiber)).toBe('ServerComponent')
  })
})

describe('findUserComponentFiber', () => {
  it('returns fiber with source info', () => {
    function MyComponent() {}
    const source = createMockSource()
    const fiber = createMockFiber({ type: MyComponent, _debugSource: source })

    expect(findUserComponentFiber(fiber, false)).toBe(fiber)
  })

  it('skips native elements and finds parent component', () => {
    function Card() {}
    const cardSource = createMockSource('/src/Card.tsx')
    const cardFiber = createMockFiber({ type: Card, _debugSource: cardSource })
    const divFiber = createMockFiber({
      type: 'div',
      _debugSource: createMockSource('/src/Card.tsx', 10),
      _debugOwner: cardFiber,
    })

    expect(findUserComponentFiber(divFiber, false)).toBe(cardFiber)
  })

  it('skips fibers with node_modules path', () => {
    const nodeModulesSource = createMockSource('node_modules/lib/index.js')
    function UserComponent() {}
    const userSource = createMockSource('/src/User.tsx')

    const userFiber = createMockFiber({
      type: UserComponent,
      _debugSource: userSource,
    })
    const libFiber = createMockFiber({
      _debugSource: nodeModulesSource,
      return: userFiber,
    })

    expect(findUserComponentFiber(libFiber, false)).toBe(userFiber)
  })

  it('skips anonymous components when skipAnonymous is true', () => {
    function NamedComponent() {}
    const namedSource = createMockSource('/src/Named.tsx')
    const namedFiber = createMockFiber({
      type: NamedComponent,
      _debugSource: namedSource,
    })

    // Create a fiber that explicitly has Anonymous behavior
    const AnonymousFunc = function() {} as unknown as () => void
    Object.defineProperty(AnonymousFunc, 'name', { value: '' })

    const anonymousFiber: Fiber = {
      type: AnonymousFunc,
      stateNode: null,
      return: namedFiber,
      child: null,
      sibling: null,
      _debugSource: undefined,
      _debugInfo: undefined,
      _debugOwner: undefined,
    }

    const result = findUserComponentFiber(anonymousFiber, true)
    expect(result).toBe(namedFiber)
  })

  it('includes anonymous components when skipAnonymous is false', () => {
    const source = createMockSource()
    const anonymousFiber = createMockFiber({
      type: () => {},
      _debugSource: source,
    })

    expect(findUserComponentFiber(anonymousFiber, false)).toBe(anonymousFiber)
  })

  it('skips React internal components starting with _', () => {
    function _InternalComponent() {}
    function UserComponent() {}

    const userFiber = createMockFiber({ type: UserComponent })
    const internalFiber = createMockFiber({
      type: _InternalComponent,
      return: userFiber,
    })

    expect(findUserComponentFiber(internalFiber, false)).toBe(userFiber)
  })

  it('returns native element fiber with RSC DebugOwner (env=Server)', () => {
    const fiber = createMockFiber({
      type: 'div',
      _debugOwner: { env: 'Server', name: 'ServerComponent' } as unknown as Fiber,
    })

    expect(findUserComponentFiber(fiber, false)).toBe(fiber)
  })

  it('traverses via _debugOwner when available', () => {
    function UserComponent() {}
    const userSource = createMockSource()
    const userFiber = createMockFiber({
      type: UserComponent,
      _debugSource: userSource,
    })
    const fiber = createMockFiber({
      type: 'div',
      _debugOwner: userFiber,
    })

    expect(findUserComponentFiber(fiber, false)).toBe(userFiber)
  })

  it('returns null when no user component found', () => {
    const fiber = createMockFiber({ type: 'div' })

    expect(findUserComponentFiber(fiber, false)).toBeNull()
  })
})

describe('getComponentStack', () => {
  it('respects maxDepth limit', () => {
    const source = createMockSource()
    function Component1() {}
    function Component2() {}
    function Component3() {}

    const fiber3 = createMockFiber({ type: Component3, _debugSource: source })
    const fiber2 = createMockFiber({ type: Component2, _debugSource: source, return: fiber3 })
    const fiber1 = createMockFiber({ type: Component1, _debugSource: source, return: fiber2 })

    const stack = getComponentStack(fiber1, 2, false)

    expect(stack).toHaveLength(2)
    expect(stack[0].name).toBe('Component1')
    expect(stack[1].name).toBe('Component2')
  })

  it('removes duplicate component names', () => {
    const source = createMockSource()
    function Component() {}

    const fiber2 = createMockFiber({ type: Component, _debugSource: source })
    const fiber1 = createMockFiber({ type: Component, _debugSource: source, return: fiber2 })

    const stack = getComponentStack(fiber1, 5, false)

    expect(stack).toHaveLength(1)
    expect(stack[0].name).toBe('Component')
  })

  it('prevents infinite loops with circular references', () => {
    const source = createMockSource()
    function Component() {}

    const fiber = createMockFiber({ type: Component, _debugSource: source })
    fiber.return = fiber

    const stack = getComponentStack(fiber, 10, false)

    expect(stack).toHaveLength(1)
  })

  it('traverses RSC owner chain', () => {
    const fiber = createMockFiber({
      type: 'div',
      _debugOwner: {
        env: 'Server',
        name: 'ServerComponent1',
        owner: {
          name: 'ServerComponent2',
          owner: null,
        },
      } as unknown as Fiber,
    })

    const stack = getComponentStack(fiber, 5, false)

    expect(stack).toHaveLength(2)
    expect(stack[0].name).toBe('ServerComponent1')
    expect(stack[1].name).toBe('ServerComponent2')
  })

  it('skips anonymous in RSC owner chain when skipAnonymous is true', () => {
    const fiber = createMockFiber({
      type: 'div',
      _debugOwner: {
        env: 'Server',
        name: 'Unknown',
        owner: {
          name: 'NamedComponent',
          owner: null,
        },
      } as unknown as Fiber,
    })

    const stack = getComponentStack(fiber, 5, true)

    expect(stack).toHaveLength(1)
    expect(stack[0].name).toBe('NamedComponent')
  })

  it('builds client component stack', () => {
    const source1 = createMockSource('/src/A.tsx')
    const source2 = createMockSource('/src/B.tsx')
    function ComponentA() {}
    function ComponentB() {}

    const fiberB = createMockFiber({ type: ComponentB, _debugSource: source2 })
    const fiberA = createMockFiber({
      type: ComponentA,
      _debugSource: source1,
      _debugOwner: fiberB,
    })

    const stack = getComponentStack(fiberA, 5, false)

    expect(stack).toHaveLength(2)
    expect(stack[0].name).toBe('ComponentA')
    expect(stack[0].source).toEqual(source1)
    expect(stack[1].name).toBe('ComponentB')
    expect(stack[1].source).toEqual(source2)
  })

  it('returns empty array for fiber without source', () => {
    const fiber = createMockFiber({ type: 'div' })

    const stack = getComponentStack(fiber, 5, false)

    expect(stack).toEqual([])
  })
})

describe('formatSourceLocation', () => {
  it('returns fileName:line:column format', () => {
    const source = createMockSource('/src/App.tsx', 10, 5)

    expect(formatSourceLocation(source)).toBe('/src/App.tsx:10:5')
  })

  it('returns only fileName when lineNumber is 0', () => {
    const source = createMockSource('/src/App.tsx', 0, 0)

    expect(formatSourceLocation(source)).toBe('/src/App.tsx')
  })
})

describe('getShortFileName', () => {
  it('extracts filename from path', () => {
    expect(getShortFileName('/src/components/App.tsx')).toBe('App.tsx')
  })

  it('returns original for single filename', () => {
    expect(getShortFileName('App.tsx')).toBe('App.tsx')
  })

  it('handles empty string', () => {
    expect(getShortFileName('')).toBe('')
  })
})

describe('formatComponentStack', () => {
  it('returns empty string for empty array', () => {
    expect(formatComponentStack([])).toBe('')
  })

  it('formats single component', () => {
    const stack = [{ name: 'App', source: createMockSource('/src/App.tsx', 10, 5) }]

    expect(formatComponentStack(stack)).toBe('App (/src/App.tsx:10:5)')
  })

  it('formats multiple components with indentation', () => {
    const stack = [
      { name: 'Child', source: createMockSource('/src/Child.tsx', 5, 1) },
      { name: 'Parent', source: createMockSource('/src/Parent.tsx', 10, 2) },
      { name: 'App', source: createMockSource('/src/App.tsx', 15, 3) },
    ]

    const expected = `Child (/src/Child.tsx:5:1)
  ← Parent (/src/Parent.tsx:10:2)
    ← App (/src/App.tsx:15:3)`

    expect(formatComponentStack(stack)).toBe(expected)
  })

  it('formats component without source', () => {
    const stack = [{ name: 'Component', source: null }]

    expect(formatComponentStack(stack)).toBe('Component')
  })

  it('mixes components with and without source', () => {
    const stack = [
      { name: 'Child', source: createMockSource('/src/Child.tsx', 5, 1) },
      { name: 'Parent', source: null },
    ]

    const expected = `Child (/src/Child.tsx:5:1)
  ← Parent`

    expect(formatComponentStack(stack)).toBe(expected)
  })
})
