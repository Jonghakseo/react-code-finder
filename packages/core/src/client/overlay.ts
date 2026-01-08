interface OverlayInfo {
  componentName: string
  source: string
}

const HOST_ID = 'react-code-finder-overlay'

export class Overlay {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private overlay: HTMLDivElement | null = null
  private label: HTMLDivElement | null = null

  show(target: HTMLElement, info: OverlayInfo): void {
    if (!this.host) {
      this.createElement()
    }

    const rect = target.getBoundingClientRect()

    this.host!.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 999999;
    `

    this.overlay!.style.display = 'block'
    this.label!.textContent = `<${info.componentName}>`
    this.label!.title = info.source
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none'
    }
  }

  destroy(): void {
    this.host?.remove()
    this.host = null
    this.shadowRoot = null
    this.overlay = null
    this.label = null
  }

  private createElement(): void {
    this.host = document.createElement('div')
    this.host.id = HOST_ID

    this.shadowRoot = this.host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = `
      .rcf-overlay {
        all: initial;
        display: none;
        box-sizing: border-box;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        pointer-events: none;
      }
      .rcf-label {
        all: initial;
        display: block;
        position: absolute;
        bottom: 100%;
        left: -2px;
        background: #3b82f6;
        color: white;
        font-size: 12px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        padding: 2px 8px;
        border-radius: 4px 4px 0 0;
        white-space: nowrap;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
      }
    `

    this.overlay = document.createElement('div')
    this.overlay.className = 'rcf-overlay'

    this.label = document.createElement('div')
    this.label.className = 'rcf-label'

    this.overlay.appendChild(this.label)
    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(this.overlay)
    document.body.appendChild(this.host)
  }
}
