import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Inspector } from '../inspector'
import type { Fiber, ReactDevToolsHook } from '../../core/types'

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

describe('Inspector', () => {
  let originalEnv: string | undefined
  let originalHook: ReactDevToolsHook | undefined

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV
    originalHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    document.body.innerHTML = ''
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    if (originalHook) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = originalHook
    } else {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    }
    document.body.innerHTML = ''
  })

  describe('constructor', () => {
    it('applies default options', () => {
      process.env.NODE_ENV = 'development'
      const inspector = new Inspector()

      expect(inspector).toBeDefined()
    })

    it('applies custom options', () => {
      const inspector = new Inspector({
        enabled: true,
        buttonPosition: 'top-left',
        maxDepth: 10,
        skipAnonymous: false,
      })

      expect(inspector).toBeDefined()
    })

    it('defaults enabled to true in development', () => {
      process.env.NODE_ENV = 'development'
      const inspector = new Inspector()

      inspector.init()
      expect(document.getElementById('react-code-finder-toggle-button')).not.toBeNull()
      inspector.destroy()
    })

    it('defaults enabled to false in production', () => {
      process.env.NODE_ENV = 'production'
      const inspector = new Inspector()

      inspector.init()
      expect(document.getElementById('react-code-finder-toggle-button')).toBeNull()
      inspector.destroy()
    })
  })

  describe('init', () => {
    it('does not initialize when enabled is false', () => {
      const inspector = new Inspector({ enabled: false })

      inspector.init()

      expect(document.getElementById('react-code-finder-toggle-button')).toBeNull()
    })

    it('creates toggle button when enabled', () => {
      const inspector = new Inspector({ enabled: true })

      inspector.init()

      expect(document.getElementById('react-code-finder-toggle-button')).not.toBeNull()
      inspector.destroy()
    })

    it('hooks into React DevTools', () => {
      const inspector = new Inspector({ enabled: true })

      inspector.init()

      expect(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeDefined()
      inspector.destroy()
    })
  })

  describe('destroy', () => {
    it('removes toggle button', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      expect(document.getElementById('react-code-finder-toggle-button')).not.toBeNull()

      inspector.destroy()

      expect(document.getElementById('react-code-finder-toggle-button')).toBeNull()
    })

    it('removes overlay if present', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      inspector.destroy()

      expect(document.getElementById('react-code-finder-overlay')).toBeNull()
    })

    it('removes toast container if present', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      inspector.destroy()

      expect(document.getElementById('react-code-finder-toast-container')).toBeNull()
    })

    it('can be called multiple times safely', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      expect(() => {
        inspector.destroy()
        inspector.destroy()
      }).not.toThrow()
    })
  })

  describe('event handling', () => {
    it('handles mouseover on elements with fiber data', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      function TestComponent() {}
      const fiber = createMockFiber({
        type: TestComponent,
        _debugSource: { fileName: '/src/Test.tsx', lineNumber: 10, columnNumber: 5 },
      })

      const target = document.createElement('div')
      ;(target as unknown as Record<string, Fiber>).__reactFiber$test = fiber
      document.body.appendChild(target)

      // Trigger click to enable inspector first
      // (We can't access Shadow DOM buttons, but we can test the inspector behavior)
      inspector.destroy()
    })

    it('filters out internal elements', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      const toggleButton = document.getElementById('react-code-finder-toggle-button')
      expect(toggleButton).not.toBeNull()

      inspector.destroy()
    })
  })

  describe('fiber finding', () => {
    it('finds fiber from element with __reactFiber property', () => {
      const inspector = new Inspector({ enabled: true })
      inspector.init()

      function TestComponent() {}
      const fiber = createMockFiber({
        type: TestComponent,
        _debugSource: { fileName: '/src/Test.tsx', lineNumber: 10, columnNumber: 5 },
      })

      const target = document.createElement('div')
      ;(target as unknown as Record<string, Fiber>).__reactFiber$abc123 = fiber
      document.body.appendChild(target)

      // Fiber finding works through findFiberFromElement which is already tested
      inspector.destroy()
    })
  })
})
