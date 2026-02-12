type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

const HOST_ID = 'react-code-finder-toggle-button'

export class ToggleButton {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private button: HTMLButtonElement | null = null
  private isActive = false
  private onClick: (active: boolean) => void

  constructor(onClick: (active: boolean) => void) {
    this.onClick = onClick
  }

  create(position: Position = 'bottom-right'): void {
    this.host = document.createElement('div')
    this.host.id = HOST_ID
    this.host.style.cssText = this.getHostStyles(position)

    this.shadowRoot = this.host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = this.getButtonStyles()
    this.shadowRoot.appendChild(style)

    this.button = document.createElement('button')
    this.button.className = 'rcf-btn'
    this.button.title = 'Click to enable inspector'
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `

    this.button.addEventListener('click', () => {
      this.isActive = !this.isActive
      this.setActive(this.isActive)
      this.onClick(this.isActive)
    })

    this.shadowRoot.appendChild(this.button)
    document.body.appendChild(this.host)
  }

  setActive(active: boolean): void {
    this.isActive = active
    if (this.button) {
      this.button.classList.toggle('rcf-btn-active', active)
      this.button.classList.remove('rcf-btn-select')
      this.button.title = active
        ? 'Click to disable inspector'
        : 'Click to enable inspector'
    }
  }

  setSelectMode(active: boolean): void {
    if (this.button) {
      this.button.classList.toggle('rcf-btn-select', active)
    }
  }

  destroy(): void {
    this.host?.remove()
    this.host = null
    this.shadowRoot = null
    this.button = null
  }

  private getHostStyles(position: Position): string {
    const positions: Record<Position, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
    }

    return `
      position: fixed;
      z-index: 999998;
      ${positions[position]}
    `
  }

  private getButtonStyles(): string {
    return `
      .rcf-btn {
        all: initial;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        background: #1f2937;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transition: all 0.2s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .rcf-btn:hover {
        transform: scale(1.1);
        background: #374151;
      }
      .rcf-btn.rcf-btn-active {
        background: #3b82f6;
      }
      .rcf-btn.rcf-btn-active:hover {
        background: #2563eb;
      }
      .rcf-btn.rcf-btn-select {
        background: #f59e0b;
      }
      .rcf-btn.rcf-btn-select:hover {
        background: #d97706;
      }
      .rcf-btn svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
    `
  }
}
