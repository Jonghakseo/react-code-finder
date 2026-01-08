export interface SourceLocation {
  fileName: string
  lineNumber: number
  columnNumber: number
}

export interface Fiber {
  stateNode: HTMLElement | null
  type: Function | string | null
  child: Fiber | null
  sibling: Fiber | null
  return: Fiber | null
  _debugSource?: SourceLocation | null
  _debugInfo?: SourceLocation | null  // React 19
  _debugOwner?: Fiber | null
  pendingProps?: Record<string, unknown>
}

export interface FiberRoot {
  current: Fiber
  _debugRootType?: string
}

export interface ReactDevToolsHook {
  renderers: Map<number, unknown>
  supportsFiber: boolean
  inject: (renderer: unknown) => number
  onCommitFiberRoot: (
    rendererID: number,
    root: FiberRoot,
    priorityLevel?: number
  ) => void
  onCommitFiberUnmount: (rendererID: number, fiber: Fiber) => void
}

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook
    __REACT_CODE_FINDER__?: unknown
  }
}
