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

/**
 * Configuration options for React Code Finder.
 *
 * @example
 * ```typescript
 * // Vite
 * reactCodeFinder({
 *   enabled: true,
 *   buttonPosition: 'bottom-left',
 *   maxDepth: 10,
 *   skipAnonymous: false,
 * })
 *
 * // Next.js
 * withReactCodeFinder({
 *   enabled: true,
 *   buttonPosition: 'top-right',
 * })({ ...nextConfig })
 * ```
 */
export interface ReactCodeFinderOptions {
  /**
   * Enable or disable the inspector.
   * When disabled, the toggle button and inspector functionality are not rendered.
   * @default true
   */
  enabled?: boolean

  /**
   * Position of the toggle button on the screen.
   * The button is used to activate/deactivate the inspector mode.
   * @default 'bottom-right'
   */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

  /**
   * Maximum depth of the component stack trace to copy.
   * When you click a component, it copies the component hierarchy up to this depth.
   * Higher values provide more context but result in longer clipboard content.
   * @default 5
   */
  maxDepth?: number

  /**
   * Skip anonymous and unknown components in the stack trace.
   * When true, components without proper names (e.g., arrow functions without displayName)
   * are excluded from the stack trace and the inspector traverses to their parent instead.
   * Set to false if you want to see all components including anonymous ones.
   * @default true
   */
  skipAnonymous?: boolean
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook
    __REACT_CODE_FINDER__?: unknown
  }
}
