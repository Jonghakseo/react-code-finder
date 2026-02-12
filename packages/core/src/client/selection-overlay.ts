const HOST_ID = 'react-code-finder-selection-overlay'

export class SelectionOverlay {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private rect: HTMLDivElement | null = null

  show(x: number, y: number, width: number, height: number): void {
    if (!this.host) this.createElement()

    this.rect!.style.left = `${Math.min(x, x + width)}px`
    this.rect!.style.top = `${Math.min(y, y + height)}px`
    this.rect!.style.width = `${Math.abs(width)}px`
    this.rect!.style.height = `${Math.abs(height)}px`
    this.rect!.style.display = 'block'
  }

  hide(): void {
    if (this.rect) this.rect.style.display = 'none'
  }

  destroy(): void {
    this.host?.remove()
    this.host = null
    this.shadowRoot = null
    this.rect = null
  }

  private createElement(): void {
    this.host = document.createElement('div')
    this.host.id = HOST_ID
    this.host.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:999999;'

    this.shadowRoot = this.host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = `
      .rcf-selection-rect {
        position: absolute;
        border: 2px dashed #f59e0b;
        background: rgba(245, 158, 11, 0.1);
        pointer-events: none;
        display: none;
      }
    `

    this.rect = document.createElement('div')
    this.rect.className = 'rcf-selection-rect'

    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(this.rect)
    document.body.appendChild(this.host)
  }
}
