import type { Fiber, ReactCodeFinderOptions, ReactCodeFinderAPI } from '../core/types'
import {
  hookIntoReactDevTools,
  traverseFiberTree,
  findFiberFromElement,
} from '../core/fiber'
import {
  getSourceFromFiber,
  getComponentName,
  findUserComponentFiber,
  formatSourceLocation,
  getComponentStack,
} from '../core/source'
import { formatOutput, formatComponentTree } from '../core/formatter'
import { findComponentsInArea, type ComponentTreeNode, type SelectionRect } from '../core/area-selection'
import { SelectionOverlay } from './selection-overlay'
import { validateOptions } from '../core/validate'
import { logger } from '../core/errors'
import { Overlay } from './overlay'
import { Toast } from './toast'
import { ToggleButton } from './toggle-button'
import { copyToClipboard } from './clipboard'
import { fetchSourceCode, type SourceSnippet } from './source-fetcher'

export class Inspector {
  private enabled = false
  private mode: 'inspect' | 'select' = 'inspect'
  private overlay: Overlay
  private selectionOverlay: SelectionOverlay
  private toast: Toast
  private toggleButton: ToggleButton
  private elementToFiberMap = new WeakMap<HTMLElement, Fiber>()
  private unhookFn: (() => void) | null = null
  private options: Required<ReactCodeFinderOptions>
  private currentTarget: HTMLElement | null = null
  private dragStart: { x: number; y: number } | null = null
  private isDragging = false

  constructor(options: ReactCodeFinderOptions = {}) {
    validateOptions(options)

    this.options = {
      enabled: options.enabled ?? process.env.NODE_ENV === 'development',
      buttonPosition: options.buttonPosition ?? 'bottom-right',
      maxDepth: options.maxDepth ?? 5,
      skipAnonymous: options.skipAnonymous ?? true,
      debug: options.debug ?? false,
      showNoSource: options.showNoSource ?? false,
      disableOnEscape: options.disableOnEscape ?? true,
      outputFormat: options.outputFormat ?? 'xml',
    }

    logger.setDebugMode(this.options.debug)
    logger.debug('Inspector initialized with options:', this.options)

    this.overlay = new Overlay()
    this.selectionOverlay = new SelectionOverlay()
    this.toast = new Toast()
    this.toggleButton = new ToggleButton((active) => {
      if (active) {
        this.enableInspector()
      } else {
        this.disableInspector()
      }
    })
  }

  init(): void {
    if (!this.options.enabled) {
      logger.debug('Inspector disabled, skipping initialization')
      return
    }

    logger.debug('Initializing inspector...')
    this.toggleButton.create(this.options.buttonPosition)

    try {
      this.unhookFn = hookIntoReactDevTools((fiberRoot) => {
        logger.debug('Fiber root committed, traversing tree')
        this.traverseFiberTree(fiberRoot.current)
      })
      logger.debug('Successfully hooked into React DevTools')
    } catch (error) {
      logger.error('Failed to hook into React DevTools:', error)
      this.toast.show('Initialization error', 'info')
    }

    this.registerGlobalAPI()
  }

  destroy(): void {
    this.disable()
    this.unhookFn?.()
    this.unhookFn = null
    this.toggleButton.destroy()
    this.overlay.destroy()
    this.selectionOverlay.destroy()
    this.toast.destroy()
    delete window.__REACT_CODE_FINDER__
  }

  enable(): void {
    this.enableInspector()
    this.toggleButton.setActive(true)
  }

  disable(): void {
    this.disableInspector()
    this.toggleButton.setActive(false)
  }

  toggle(): void {
    if (this.enabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  private registerGlobalAPI(): void {
    const api: ReactCodeFinderAPI = {
      enable: () => this.enable(),
      disable: () => this.disable(),
      toggle: () => this.toggle(),
      get isEnabled() {
        return this.isEnabled
      },
    }

    Object.defineProperty(api, 'isEnabled', {
      get: () => this.enabled,
      enumerable: true,
    })

    window.__REACT_CODE_FINDER__ = api
    logger.debug('Global API registered: window.__REACT_CODE_FINDER__')
  }

  private enableInspector(): void {
    if (this.enabled) return
    this.enabled = true

    document.addEventListener('mouseover', this.handleMouseOver, true)
    document.addEventListener('mouseout', this.handleMouseOut, true)
    document.addEventListener('click', this.handleClick, true)
    document.addEventListener('keydown', this.handleKeyDown, true)
    document.body.style.cursor = 'crosshair'

    this.toast.show('Inspector enabled', 'info')
  }

  private disableInspector(): void {
    if (!this.enabled) return
    this.enabled = false

    document.removeEventListener('mouseover', this.handleMouseOver, true)
    document.removeEventListener('mouseout', this.handleMouseOut, true)
    document.removeEventListener('click', this.handleClick, true)
    document.removeEventListener('keydown', this.handleKeyDown, true)
    document.removeEventListener('mousedown', this.handleMouseDown, true)
    document.removeEventListener('mousemove', this.handleMouseMoveSelection, true)
    document.removeEventListener('mouseup', this.handleMouseUp, true)
    document.body.style.cursor = ''

    this.mode = 'inspect'
    this.currentTarget = null
    this.dragStart = null
    this.isDragging = false
    this.overlay.hide()
    this.selectionOverlay.hide()
  }

  private traverseFiberTree(fiber: Fiber): void {
    traverseFiberTree(fiber, (f) => {
      if (f.stateNode instanceof HTMLElement) {
        this.elementToFiberMap.set(f.stateNode, f)
      }
    })
  }

  private findComponentFiber(element: HTMLElement): Fiber | null {
    let current: HTMLElement | null = element

    while (current) {
      let fiber = this.elementToFiberMap.get(current)

      if (!fiber) {
        fiber = findFiberFromElement(current) ?? undefined
      }

      if (fiber) {
        const userFiber = findUserComponentFiber(fiber, this.options.skipAnonymous)
        if (userFiber) return userFiber
      }

      current = current.parentElement
    }

    return null
  }

  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.enabled) return

    const target = e.target as HTMLElement
    if (this.isInternalElement(target)) return

    if (target === this.currentTarget) return

    const fiber = this.findComponentFiber(target)

    if (fiber) {
      this.currentTarget = target
      const source = getSourceFromFiber(fiber)
      const name = getComponentName(fiber)

      logger.debug('Hovered component:', name, source)

      if (source) {
        this.overlay.show(target, {
          componentName: name,
          source: formatSourceLocation(source),
        })
      } else if (this.options.showNoSource) {
        this.overlay.show(target, {
          componentName: name,
          source: 'No source available',
        })
      } else {
        logger.debug('No source info for component:', name)
        this.currentTarget = null
        this.overlay.hide()
      }
    } else {
      this.currentTarget = null
      this.overlay.hide()
    }
  }

  private handleMouseOut = (e: MouseEvent): void => {
    const relatedTarget = e.relatedTarget as HTMLElement | null

    // Don't hide if moving to a child element or internal element
    if (relatedTarget && (
      this.currentTarget?.contains(relatedTarget) ||
      this.isInternalElement(relatedTarget)
    )) {
      return
    }

    // Only hide if leaving the current target
    if (!relatedTarget || !this.currentTarget?.contains(relatedTarget)) {
      this.currentTarget = null
      this.overlay.hide()
    }
  }

  private handleClick = (e: MouseEvent): void => {
    if (!this.enabled) return

    const target = e.target as HTMLElement
    if (this.isInternalElement(target)) return

    e.preventDefault()
    e.stopImmediatePropagation()

    const fiber = this.findComponentFiber(target)

    if (fiber) {
      try {
        const stack = getComponentStack(fiber, this.options.maxDepth, this.options.skipAnonymous)
        logger.debug('Component stack:', stack)

        if (stack.length > 0) {
          this.fetchSourceAndCopy(stack)
        } else {
          logger.debug('No source info found for clicked component')
          this.toast.show('No source info', 'info')
        }
      } catch (error) {
        logger.error('Error getting component stack:', error)
        this.toast.show('Error occurred', 'info')
      }
    }
  }

  private async fetchSourceAndCopy(stack: ReturnType<typeof getComponentStack>): Promise<void> {
    const sources = new Map<string, SourceSnippet>()
    const primary = stack[0]

    if (primary?.source) {
      const snippet = await fetchSourceCode(primary.source.fileName, primary.source.lineNumber)
      if (snippet) {
        sources.set(primary.source.fileName, snippet)
      }
    }

    const output = formatOutput(stack, sources, this.options.outputFormat)

    const success = await copyToClipboard(output)
    if (success) {
      this.toast.show('Copied!', 'success')
    } else {
      logger.warn('Failed to copy to clipboard')
      this.toast.show('Failed to copy', 'info')
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.options.disableOnEscape) {
      this.disable()
    }
    if ((e.key === 's' || e.key === 'S') && this.enabled) {
      this.toggleSelectionMode()
    }
  }

  private toggleSelectionMode(): void {
    if (this.mode === 'inspect') {
      this.mode = 'select'
      document.body.style.cursor = 'crosshair'
      this.toggleButton.setSelectMode(true)
      this.toast.show('Area selection mode (drag to select)', 'info')
      document.addEventListener('mousedown', this.handleMouseDown, true)
      document.addEventListener('mousemove', this.handleMouseMoveSelection, true)
      document.addEventListener('mouseup', this.handleMouseUp, true)
      document.removeEventListener('mouseover', this.handleMouseOver, true)
      document.removeEventListener('mouseout', this.handleMouseOut, true)
      document.removeEventListener('click', this.handleClick, true)
      this.overlay.hide()
    } else {
      this.mode = 'inspect'
      this.toggleButton.setSelectMode(false)
      this.toast.show('Inspector mode', 'info')
      document.removeEventListener('mousedown', this.handleMouseDown, true)
      document.removeEventListener('mousemove', this.handleMouseMoveSelection, true)
      document.removeEventListener('mouseup', this.handleMouseUp, true)
      document.addEventListener('mouseover', this.handleMouseOver, true)
      document.addEventListener('mouseout', this.handleMouseOut, true)
      document.addEventListener('click', this.handleClick, true)
      this.selectionOverlay.hide()
    }
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.enabled || this.mode !== 'select') return
    if (this.isInternalElement(e.target as HTMLElement)) return

    e.preventDefault()
    this.dragStart = { x: e.clientX, y: e.clientY }
    this.isDragging = false
  }

  private handleMouseMoveSelection = (e: MouseEvent): void => {
    if (!this.dragStart) return

    this.isDragging = true
    const width = e.clientX - this.dragStart.x
    const height = e.clientY - this.dragStart.y
    this.selectionOverlay.show(this.dragStart.x, this.dragStart.y, width, height)
  }

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.dragStart || !this.isDragging) {
      this.dragStart = null
      return
    }

    const minSize = 10
    const width = Math.abs(e.clientX - this.dragStart.x)
    const height = Math.abs(e.clientY - this.dragStart.y)

    if (width < minSize || height < minSize) {
      this.dragStart = null
      this.isDragging = false
      this.selectionOverlay.hide()
      return
    }

    const selectionRect: SelectionRect = {
      left: Math.min(this.dragStart.x, e.clientX),
      top: Math.min(this.dragStart.y, e.clientY),
      right: Math.max(this.dragStart.x, e.clientX),
      bottom: Math.max(this.dragStart.y, e.clientY),
    }

    this.dragStart = null
    this.isDragging = false
    this.selectionOverlay.hide()

    this.handleAreaSelection(selectionRect)
  }

  private async handleAreaSelection(selectionRect: SelectionRect): Promise<void> {
    const tree = findComponentsInArea(
      selectionRect,
      this.elementToFiberMap,
      this.options.skipAnonymous
    )

    if (tree.length === 0) {
      this.toast.show('No components found', 'info')
      return
    }

    const sources = new Map<string, SourceSnippet>()
    const fileNames = new Set<string>()

    const collectFiles = (nodes: ComponentTreeNode[]) => {
      for (const node of nodes) {
        if (node.source && !fileNames.has(node.source.fileName)) {
          fileNames.add(node.source.fileName)
        }
        collectFiles(node.children)
      }
    }
    collectFiles(tree)

    const fetchPromises = Array.from(fileNames).map(async (fileName) => {
      const snippet = await fetchSourceCode(fileName, 0, 50)
      if (snippet) sources.set(fileName, snippet)
    })
    await Promise.all(fetchPromises)

    const output = formatComponentTree(tree, sources, this.options.outputFormat)
    const success = await copyToClipboard(output)
    if (success) {
      this.toast.show(`Copied ${tree.length} component(s)!`, 'success')
    } else {
      logger.warn('Failed to copy to clipboard')
      this.toast.show('Failed to copy', 'info')
    }
  }

  private isInternalElement(element: HTMLElement): boolean {
    return (
      element.id === 'react-code-finder-toggle-button' ||
      element.id === 'react-code-finder-overlay' ||
      element.id === 'react-code-finder-toast-container' ||
      element.id === 'react-code-finder-selection-overlay' ||
      element.closest('#react-code-finder-toggle-button') !== null ||
      element.closest('#react-code-finder-overlay') !== null ||
      element.closest('#react-code-finder-toast-container') !== null ||
      element.closest('#react-code-finder-selection-overlay') !== null
    )
  }
}
