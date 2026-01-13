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
  formatComponentStack,
} from '../core/source'
import { validateOptions } from '../core/validate'
import { logger } from '../core/errors'
import { Overlay } from './overlay'
import { Toast } from './toast'
import { ToggleButton } from './toggle-button'
import { copyToClipboard } from './clipboard'

export class Inspector {
  private enabled = false
  private overlay: Overlay
  private toast: Toast
  private toggleButton: ToggleButton
  private elementToFiberMap = new WeakMap<HTMLElement, Fiber>()
  private unhookFn: (() => void) | null = null
  private options: Required<ReactCodeFinderOptions>
  private currentTarget: HTMLElement | null = null

  constructor(options: ReactCodeFinderOptions = {}) {
    validateOptions(options)

    this.options = {
      enabled: options.enabled ?? process.env.NODE_ENV === 'development',
      buttonPosition: options.buttonPosition ?? 'bottom-right',
      maxDepth: options.maxDepth ?? 5,
      skipAnonymous: options.skipAnonymous ?? true,
      debug: options.debug ?? false,
      showNoSource: options.showNoSource ?? false,
    }

    logger.setDebugMode(this.options.debug)
    logger.debug('Inspector initialized with options:', this.options)

    this.overlay = new Overlay()
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
    document.body.style.cursor = 'crosshair'

    this.toast.show('Inspector enabled', 'info')
  }

  private disableInspector(): void {
    if (!this.enabled) return
    this.enabled = false

    document.removeEventListener('mouseover', this.handleMouseOver, true)
    document.removeEventListener('mouseout', this.handleMouseOut, true)
    document.removeEventListener('click', this.handleClick, true)
    document.body.style.cursor = ''

    this.currentTarget = null
    this.overlay.hide()
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
          const stackText = formatComponentStack(stack)
          copyToClipboard(stackText).then((success) => {
            if (success) {
              this.toast.show('Copied!', 'success')
            } else {
              logger.warn('Failed to copy to clipboard')
              this.toast.show('Failed to copy', 'info')
            }
          })
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

  private isInternalElement(element: HTMLElement): boolean {
    return (
      element.id === 'react-code-finder-toggle-button' ||
      element.id === 'react-code-finder-overlay' ||
      element.id === 'react-code-finder-toast-container' ||
      element.closest('#react-code-finder-toggle-button') !== null ||
      element.closest('#react-code-finder-overlay') !== null ||
      element.closest('#react-code-finder-toast-container') !== null
    )
  }
}
