import type { Fiber, ReactCodeFinderOptions } from '../core/types'
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
    this.options = {
      enabled: options.enabled ?? process.env.NODE_ENV === 'development',
      buttonPosition: options.buttonPosition ?? 'bottom-right',
      maxDepth: options.maxDepth ?? 5,
      skipAnonymous: options.skipAnonymous ?? true,
    }

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
    if (!this.options.enabled) return

    this.toggleButton.create(this.options.buttonPosition)

    this.unhookFn = hookIntoReactDevTools((fiberRoot) => {
      this.traverseFiberTree(fiberRoot.current)
    })
  }

  destroy(): void {
    this.disableInspector()
    this.unhookFn?.()
    this.unhookFn = null
    this.toggleButton.destroy()
    this.overlay.destroy()
    this.toast.destroy()
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

    // Skip if same target
    if (target === this.currentTarget) return

    const fiber = this.findComponentFiber(target)

    if (fiber) {
      this.currentTarget = target
      const source = getSourceFromFiber(fiber)
      const name = getComponentName(fiber)

      this.overlay.show(target, {
        componentName: name,
        source: source ? formatSourceLocation(source) : '',
      })
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
      const stack = getComponentStack(fiber, this.options.maxDepth, this.options.skipAnonymous)
      if (stack.length > 0) {
        const stackText = formatComponentStack(stack)
        copyToClipboard(stackText).then((success) => {
          if (success) {
            this.toast.show('Copied!', 'success')
          } else {
            this.toast.show('Failed to copy', 'info')
          }
        })
      } else {
        this.toast.show('No source info', 'info')
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
