import type { Fiber, FiberRoot, ReactDevToolsHook } from './types'

type FiberRootCallback = (fiberRoot: FiberRoot) => void

export function hookIntoReactDevTools(onCommit: FiberRootCallback): () => void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__

  if (!hook) {
    const customHook: ReactDevToolsHook = {
      renderers: new Map(),
      supportsFiber: true,
      inject(renderer: unknown) {
        const id = Math.random()
        this.renderers.set(id, renderer)
        return id
      },
      onCommitFiberRoot(_rendererID: number, root: FiberRoot) {
        onCommit(root)
      },
      onCommitFiberUnmount() {},
    }

    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = customHook
    return () => {
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    }
  }

  const originalOnCommitFiberRoot = hook.onCommitFiberRoot?.bind(hook)

  hook.onCommitFiberRoot = new Proxy(hook.onCommitFiberRoot, {
    apply(target, thisArg, argumentsList: [number, FiberRoot, number?]) {
      const [, root] = argumentsList
      onCommit(root)
      return Reflect.apply(target, thisArg, argumentsList)
    },
  })

  return () => {
    if (originalOnCommitFiberRoot) {
      hook.onCommitFiberRoot = originalOnCommitFiberRoot
    }
  }
}

export function traverseFiberTree(
  fiber: Fiber | null,
  callback: (fiber: Fiber) => void
): void {
  if (!fiber) return

  callback(fiber)
  traverseFiberTree(fiber.child, callback)
  traverseFiberTree(fiber.sibling, callback)
}

export function findFiberFromElement(element: HTMLElement): Fiber | null {
  // Try React DevTools first (works with all React versions)
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  if (hook?.renderers) {
    for (const renderer of hook.renderers.values()) {
      try {
        const r = renderer as { findFiberByHostInstance?: (element: Element) => Fiber | null }
        if (r.findFiberByHostInstance) {
          const fiber = r.findFiberByHostInstance(element)
          if (fiber) return fiber
        }
      } catch {
        // Ignore errors during mid-render
      }
    }
  }

  // Fallback: find __reactFiber key (React 18+)
  for (const key in element) {
    if (key.startsWith('__reactFiber')) {
      return (element as unknown as Record<string, Fiber>)[key]
    }
  }

  // Legacy fallback
  const legacyKey = Object.keys(element).find((key) => {
    const lowerKey = key.toLowerCase()
    return lowerKey.startsWith('__reactinternalinstance')
  })

  if (legacyKey) {
    return (element as unknown as Record<string, Fiber>)[legacyKey]
  }

  return null
}
