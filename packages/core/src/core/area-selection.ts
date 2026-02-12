import type { Fiber, SourceLocation } from './types'
import { getComponentName, getSourceFromFiber, findUserComponentFiber } from './source'
import { serializeProps, type SerializedProps } from './props'

export interface ComponentTreeNode {
  name: string
  source: SourceLocation | null
  props: SerializedProps | null
  children: ComponentTreeNode[]
}

export interface SelectionRect {
  left: number
  top: number
  right: number
  bottom: number
}

export function findComponentsInArea(
  selectionRect: SelectionRect,
  elementToFiberMap: WeakMap<HTMLElement, Fiber>,
  skipAnonymous: boolean
): ComponentTreeNode[] {
  const allElements = document.querySelectorAll('*')
  const fiberSet = new Set<Fiber>()

  for (const el of allElements) {
    if (!(el instanceof HTMLElement)) continue
    const rect = el.getBoundingClientRect()

    if (
      rect.left < selectionRect.right &&
      rect.right > selectionRect.left &&
      rect.top < selectionRect.bottom &&
      rect.bottom > selectionRect.top &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      const fiber = elementToFiberMap.get(el)
      if (fiber) {
        const userFiber = findUserComponentFiber(fiber, skipAnonymous)
        if (userFiber) {
          fiberSet.add(userFiber)
        }
      }
    }
  }

  return buildComponentTree(fiberSet)
}

function buildComponentTree(fibers: Set<Fiber>): ComponentTreeNode[] {
  const fiberToNode = new Map<Fiber, ComponentTreeNode>()

  for (const fiber of fibers) {
    fiberToNode.set(fiber, {
      name: getComponentName(fiber),
      source: getSourceFromFiber(fiber),
      props: serializeProps(fiber.pendingProps),
      children: [],
    })
  }

  const roots: Fiber[] = []

  for (const fiber of fibers) {
    let parent: Fiber | null = fiber.return
    let foundParent = false

    while (parent) {
      if (fibers.has(parent)) {
        fiberToNode.get(parent)!.children.push(fiberToNode.get(fiber)!)
        foundParent = true
        break
      }
      parent = parent.return
    }

    if (!foundParent) {
      roots.push(fiber)
    }
  }

  return roots.map((f) => fiberToNode.get(f)!)
}
