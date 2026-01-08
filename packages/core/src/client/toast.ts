type ToastType = 'success' | 'info'

const HOST_ID = 'react-code-finder-toast-container'

export class Toast {
  private host: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private container: HTMLDivElement | null = null

  show(message: string, type: ToastType = 'info'): void {
    if (!this.host) {
      this.createContainer()
    }

    const toast = document.createElement('div')
    toast.className = `rcf-toast rcf-toast-${type}`
    toast.textContent = message

    this.container!.appendChild(toast)

    setTimeout(() => {
      toast.classList.add('rcf-toast-hide')
      setTimeout(() => toast.remove(), 300)
    }, 1500)
  }

  destroy(): void {
    this.host?.remove()
    this.host = null
    this.shadowRoot = null
    this.container = null
  }

  private createContainer(): void {
    this.host = document.createElement('div')
    this.host.id = HOST_ID
    this.host.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
    `

    this.shadowRoot = this.host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = `
      .rcf-container {
        all: initial;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .rcf-toast {
        all: initial;
        display: block;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-family: system-ui, -apple-system, sans-serif;
        color: white;
        animation: rcf-slide-in 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .rcf-toast-success {
        background: #10b981;
      }
      .rcf-toast-info {
        background: #3b82f6;
      }
      .rcf-toast-hide {
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      }
      @keyframes rcf-slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `

    this.container = document.createElement('div')
    this.container.className = 'rcf-container'

    this.shadowRoot.appendChild(style)
    this.shadowRoot.appendChild(this.container)
    document.body.appendChild(this.host)
  }
}
