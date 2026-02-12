import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ToggleButton } from '../toggle-button'

describe('ToggleButton', () => {
  let toggleButton: ToggleButton
  let onClickMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onClickMock = vi.fn()
    toggleButton = new ToggleButton(onClickMock)
    document.body.innerHTML = ''
  })

  afterEach(() => {
    toggleButton.destroy()
    document.body.innerHTML = ''
  })

  describe('create', () => {
    it('creates host element', () => {
      toggleButton.create('bottom-right')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host).not.toBeNull()
    })

    it('applies bottom-right position', () => {
      toggleButton.create('bottom-right')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.bottom).toBe('20px')
      expect(host?.style.right).toBe('20px')
    })

    it('applies bottom-left position', () => {
      toggleButton.create('bottom-left')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.bottom).toBe('20px')
      expect(host?.style.left).toBe('20px')
    })

    it('applies top-right position', () => {
      toggleButton.create('top-right')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.top).toBe('20px')
      expect(host?.style.right).toBe('20px')
    })

    it('applies top-left position', () => {
      toggleButton.create('top-left')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.top).toBe('20px')
      expect(host?.style.left).toBe('20px')
    })

    it('defaults to bottom-right position', () => {
      toggleButton.create()

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.bottom).toBe('20px')
      expect(host?.style.right).toBe('20px')
    })

    it('sets fixed position', () => {
      toggleButton.create('bottom-right')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.position).toBe('fixed')
    })

    it('sets z-index', () => {
      toggleButton.create('bottom-right')

      const host = document.getElementById('react-code-finder-toggle-button')
      expect(host?.style.zIndex).toBe('999998')
    })
  })

  describe('setActive', () => {
    it('can be called before create without error', () => {
      expect(() => {
        toggleButton.setActive(true)
      }).not.toThrow()
    })

    it('can toggle active state', () => {
      toggleButton.create('bottom-right')

      expect(() => {
        toggleButton.setActive(true)
        toggleButton.setActive(false)
      }).not.toThrow()
    })
  })

  describe('setSelectMode', () => {
    it('can be called before create without error', () => {
      expect(() => {
        toggleButton.setSelectMode(true)
      }).not.toThrow()
    })

    it('can toggle select mode state', () => {
      toggleButton.create('bottom-right')

      expect(() => {
        toggleButton.setSelectMode(true)
        toggleButton.setSelectMode(false)
      }).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('removes host element from DOM', () => {
      toggleButton.create('bottom-right')
      expect(document.getElementById('react-code-finder-toggle-button')).not.toBeNull()

      toggleButton.destroy()
      expect(document.getElementById('react-code-finder-toggle-button')).toBeNull()
    })

    it('can be called before create', () => {
      expect(() => {
        toggleButton.destroy()
      }).not.toThrow()
    })

    it('can be called multiple times', () => {
      toggleButton.create('bottom-right')

      expect(() => {
        toggleButton.destroy()
        toggleButton.destroy()
      }).not.toThrow()
    })

    it('allows create to work after destroy', () => {
      toggleButton.create('bottom-right')
      toggleButton.destroy()

      toggleButton.create('top-left')
      expect(document.getElementById('react-code-finder-toggle-button')).not.toBeNull()
    })
  })
})
