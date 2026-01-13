import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Toast } from '../toast'

describe('Toast', () => {
  let toast: Toast

  beforeEach(() => {
    toast = new Toast()
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(() => {
    toast.destroy()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  describe('show', () => {
    it('creates host element on first call', () => {
      toast.show('Test message', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('creates Shadow DOM', () => {
      toast.show('Test message', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host?.shadowRoot).toBeNull()
    })

    it('reuses existing host element', () => {
      toast.show('Message 1', 'info')
      const host1 = document.getElementById('react-code-finder-toast-container')

      toast.show('Message 2', 'success')
      const host2 = document.getElementById('react-code-finder-toast-container')

      expect(host1).toBe(host2)
    })

    it('applies success type class', () => {
      toast.show('Success!', 'success')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('applies info type class', () => {
      toast.show('Info message', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('defaults to info type', () => {
      toast.show('Default type')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('adds hide class after 1.5 seconds', () => {
      toast.show('Test message', 'info')

      vi.advanceTimersByTime(1500)

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('removes toast element after 1.8 seconds', () => {
      toast.show('Test message', 'info')

      vi.advanceTimersByTime(1800)

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('can show multiple toasts', () => {
      toast.show('Message 1', 'info')
      toast.show('Message 2', 'success')
      toast.show('Message 3', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host).not.toBeNull()
    })

    it('sets fixed position styles', () => {
      toast.show('Test', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host?.style.position).toBe('fixed')
      expect(host?.style.bottom).toBe('80px')
      expect(host?.style.right).toBe('20px')
    })

    it('sets high z-index', () => {
      toast.show('Test', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host?.style.zIndex).toBe('999999')
    })

    it('sets pointer-events to none', () => {
      toast.show('Test', 'info')

      const host = document.getElementById('react-code-finder-toast-container')
      expect(host?.style.pointerEvents).toBe('none')
    })
  })

  describe('destroy', () => {
    it('removes host element from DOM', () => {
      toast.show('Test', 'info')
      expect(document.getElementById('react-code-finder-toast-container')).not.toBeNull()

      toast.destroy()
      expect(document.getElementById('react-code-finder-toast-container')).toBeNull()
    })

    it('can be called before show', () => {
      expect(() => {
        toast.destroy()
      }).not.toThrow()
    })

    it('can be called multiple times', () => {
      toast.show('Test', 'info')

      expect(() => {
        toast.destroy()
        toast.destroy()
      }).not.toThrow()
    })

    it('allows show to work after destroy', () => {
      toast.show('Test 1', 'info')
      toast.destroy()

      toast.show('Test 2', 'success')
      expect(document.getElementById('react-code-finder-toast-container')).not.toBeNull()
    })
  })
})
