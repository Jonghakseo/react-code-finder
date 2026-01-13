import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Fiber, FiberRoot, ReactDevToolsHook } from '../types'
import {
  hookIntoReactDevTools,
  traverseFiberTree,
  findFiberFromElement,
} from '../fiber'

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

function createMockFiberRoot(current: Fiber): FiberRoot {
  return { current }
}

describe('hookIntoReactDevTools', () => {
  const originalHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__

  beforeEach(() => {
    delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  })

  afterEach(() => {
    if (originalHook) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = originalHook
    } else {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    }
  })

  it('creates new hook when none exists', () => {
    const onCommit = vi.fn()

    const cleanup = hookIntoReactDevTools(onCommit)

    expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeDefined()
    expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.supportsFiber).toBe(true)
    expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers).toBeInstanceOf(Map)

    cleanup()
  })

  it('deletes custom hook on cleanup when created', () => {
    const onCommit = vi.fn()

    const cleanup = hookIntoReactDevTools(onCommit)
    expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeDefined()

    cleanup()
    expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeUndefined()
  })

  it('calls onCommit when custom hook receives fiber root', () => {
    const onCommit = vi.fn()
    hookIntoReactDevTools(onCommit)

    const fiber = createMockFiber()
    const root = createMockFiberRoot(fiber)

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot(1, root)

    expect(onCommit).toHaveBeenCalledWith(root)
  })

  it('wraps existing hook with Proxy', () => {
    const existingOnCommit = vi.fn()
    const existingHook: ReactDevToolsHook = {
      renderers: new Map(),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: existingOnCommit,
      onCommitFiberUnmount: vi.fn(),
    }
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = existingHook

    const onCommit = vi.fn()
    const cleanup = hookIntoReactDevTools(onCommit)

    const fiber = createMockFiber()
    const root = createMockFiberRoot(fiber)

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot(1, root)

    expect(onCommit).toHaveBeenCalledWith(root)
    expect(existingOnCommit).toHaveBeenCalledWith(1, root)

    cleanup()
  })

  it('restores original hook on cleanup', () => {
    const originalOnCommit = vi.fn()
    const existingHook: ReactDevToolsHook = {
      renderers: new Map(),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: originalOnCommit,
      onCommitFiberUnmount: vi.fn(),
    }
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = existingHook

    const onCommit = vi.fn()
    const cleanup = hookIntoReactDevTools(onCommit)

    cleanup()

    // After cleanup, the hook should call original function
    const fiber = createMockFiber()
    const root = createMockFiberRoot(fiber)
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot(1, root)

    expect(originalOnCommit).toHaveBeenCalledWith(1, root)
  })

  it('inject method returns random id', () => {
    hookIntoReactDevTools(vi.fn())

    const id1 = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.inject({})
    const id2 = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.inject({})

    expect(typeof id1).toBe('number')
    expect(typeof id2).toBe('number')
    expect(id1).not.toBe(id2)
  })
})

describe('traverseFiberTree', () => {
  it('visits all fibers in DFS order', () => {
    const visited: string[] = []

    const child2 = createMockFiber({ type: 'child2' })
    const child1 = createMockFiber({ type: 'child1', sibling: child2 })
    const grandchild = createMockFiber({ type: 'grandchild' })
    child1.child = grandchild
    const root = createMockFiber({ type: 'root', child: child1 })

    traverseFiberTree(root, (fiber) => {
      visited.push(fiber.type as string)
    })

    expect(visited).toEqual(['root', 'child1', 'grandchild', 'child2'])
  })

  it('handles null fiber safely', () => {
    const callback = vi.fn()

    traverseFiberTree(null, callback)

    expect(callback).not.toHaveBeenCalled()
  })

  it('handles fiber without children', () => {
    const visited: string[] = []
    const fiber = createMockFiber({ type: 'single' })

    traverseFiberTree(fiber, (f) => {
      visited.push(f.type as string)
    })

    expect(visited).toEqual(['single'])
  })

  it('handles deep fiber tree', () => {
    const visited: string[] = []

    let current = createMockFiber({ type: 'level5' })
    for (let i = 4; i >= 1; i--) {
      current = createMockFiber({ type: `level${i}`, child: current })
    }

    traverseFiberTree(current, (fiber) => {
      visited.push(fiber.type as string)
    })

    expect(visited).toEqual(['level1', 'level2', 'level3', 'level4', 'level5'])
  })

  it('handles complex tree with siblings at multiple levels', () => {
    const visited: string[] = []

    const c2b = createMockFiber({ type: 'c2b' })
    const c2a = createMockFiber({ type: 'c2a', sibling: c2b })
    const child2 = createMockFiber({ type: 'child2', child: c2a })

    const c1b = createMockFiber({ type: 'c1b' })
    const c1a = createMockFiber({ type: 'c1a', sibling: c1b })
    const child1 = createMockFiber({ type: 'child1', child: c1a, sibling: child2 })

    const root = createMockFiber({ type: 'root', child: child1 })

    traverseFiberTree(root, (fiber) => {
      visited.push(fiber.type as string)
    })

    expect(visited).toEqual(['root', 'child1', 'c1a', 'c1b', 'child2', 'c2a', 'c2b'])
  })
})

describe('findFiberFromElement', () => {
  const originalHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__

  beforeEach(() => {
    delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  })

  afterEach(() => {
    if (originalHook) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = originalHook
    } else {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    }
  })

  it('finds fiber using DevTools renderer', () => {
    const fiber = createMockFiber({ type: 'div' })
    const element = document.createElement('div')

    const mockRenderer = {
      findFiberByHostInstance: vi.fn().mockReturnValue(fiber),
    }

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map([[1, mockRenderer]]),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: vi.fn(),
      onCommitFiberUnmount: vi.fn(),
    }

    const result = findFiberFromElement(element)

    expect(mockRenderer.findFiberByHostInstance).toHaveBeenCalledWith(element)
    expect(result).toBe(fiber)
  })

  it('finds fiber using __reactFiber key', () => {
    const fiber = createMockFiber({ type: 'div' })
    const element = document.createElement('div') as HTMLElement & { __reactFiber$abc123: Fiber }
    element.__reactFiber$abc123 = fiber

    const result = findFiberFromElement(element)

    expect(result).toBe(fiber)
  })

  it('finds fiber using legacy __reactInternalInstance key', () => {
    const fiber = createMockFiber({ type: 'div' })
    const element = document.createElement('div') as HTMLElement & { __reactInternalInstance$xyz: Fiber }
    element.__reactInternalInstance$xyz = fiber

    const result = findFiberFromElement(element)

    expect(result).toBe(fiber)
  })

  it('returns null when no fiber found', () => {
    const element = document.createElement('div')

    const result = findFiberFromElement(element)

    expect(result).toBeNull()
  })

  it('handles DevTools renderer error gracefully', () => {
    const element = document.createElement('div')

    const mockRenderer = {
      findFiberByHostInstance: vi.fn().mockImplementation(() => {
        throw new Error('Mid-render error')
      }),
    }

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map([[1, mockRenderer]]),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: vi.fn(),
      onCommitFiberUnmount: vi.fn(),
    }

    const result = findFiberFromElement(element)

    expect(result).toBeNull()
  })

  it('tries multiple renderers', () => {
    const fiber = createMockFiber({ type: 'div' })
    const element = document.createElement('div')

    const mockRenderer1 = {
      findFiberByHostInstance: vi.fn().mockReturnValue(null),
    }
    const mockRenderer2 = {
      findFiberByHostInstance: vi.fn().mockReturnValue(fiber),
    }

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map([
        [1, mockRenderer1],
        [2, mockRenderer2],
      ]),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: vi.fn(),
      onCommitFiberUnmount: vi.fn(),
    }

    const result = findFiberFromElement(element)

    expect(result).toBe(fiber)
    expect(mockRenderer1.findFiberByHostInstance).toHaveBeenCalled()
    expect(mockRenderer2.findFiberByHostInstance).toHaveBeenCalled()
  })

  it('falls back to __reactFiber when renderer returns null', () => {
    const rendererFiber = null
    const directFiber = createMockFiber({ type: 'direct' })
    const element = document.createElement('div') as HTMLElement & { __reactFiber$test: Fiber }
    element.__reactFiber$test = directFiber

    const mockRenderer = {
      findFiberByHostInstance: vi.fn().mockReturnValue(rendererFiber),
    }

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers: new Map([[1, mockRenderer]]),
      supportsFiber: true,
      inject: vi.fn(),
      onCommitFiberRoot: vi.fn(),
      onCommitFiberUnmount: vi.fn(),
    }

    const result = findFiberFromElement(element)

    expect(result).toBe(directFiber)
  })
})
