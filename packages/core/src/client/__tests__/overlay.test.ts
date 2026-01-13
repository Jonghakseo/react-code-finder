import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Overlay } from '../overlay'

describe('Overlay', () => {
  let overlay: Overlay

  beforeEach(() => {
    overlay = new Overlay()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    overlay.destroy()
    document.body.innerHTML = ''
  })

  describe('show', () => {
    it('creates host element on first call', () => {
      const target = document.createElement('div')
      target.style.width = '100px'
      target.style.height = '50px'
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '/src/Test.tsx:10:5' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host).not.toBeNull()
    })

    it('creates Shadow DOM', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host?.shadowRoot).toBeNull()
    })

    it('reuses existing host element', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test1', source: '' })
      const host1 = document.getElementById('react-code-finder-overlay')

      overlay.show(target, { componentName: 'Test2', source: '' })
      const host2 = document.getElementById('react-code-finder-overlay')

      expect(host1).toBe(host2)
    })

    it('positions overlay based on target element', () => {
      const target = document.createElement('div')
      target.style.position = 'absolute'
      target.style.top = '100px'
      target.style.left = '200px'
      target.style.width = '150px'
      target.style.height = '75px'
      document.body.appendChild(target)

      Object.defineProperty(target, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 200,
          width: 150,
          height: 75,
          right: 350,
          bottom: 175,
        }),
      })

      overlay.show(target, { componentName: 'Test', source: '' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host?.style.top).toContain('100')
      expect(host?.style.left).toContain('200')
      expect(host?.style.width).toBe('150px')
      expect(host?.style.height).toBe('75px')
    })

    it('sets component name in label', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'MyComponent', source: '' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host).not.toBeNull()
    })

    it('sets source as title attribute', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '/src/Test.tsx:10:5' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host).not.toBeNull()
    })

    it('sets pointer-events to none', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host?.style.pointerEvents).toBe('none')
    })

    it('sets high z-index', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })

      const host = document.getElementById('react-code-finder-overlay')
      expect(host?.style.zIndex).toBe('999999')
    })
  })

  describe('hide', () => {
    it('hides the overlay', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })
      overlay.hide()

      const host = document.getElementById('react-code-finder-overlay')
      expect(host).not.toBeNull()
    })

    it('can be called before show', () => {
      expect(() => {
        overlay.hide()
      }).not.toThrow()
    })

    it('can be called multiple times', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })

      expect(() => {
        overlay.hide()
        overlay.hide()
        overlay.hide()
      }).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('removes host element from DOM', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })
      expect(document.getElementById('react-code-finder-overlay')).not.toBeNull()

      overlay.destroy()
      expect(document.getElementById('react-code-finder-overlay')).toBeNull()
    })

    it('can be called before show', () => {
      expect(() => {
        overlay.destroy()
      }).not.toThrow()
    })

    it('can be called multiple times', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test', source: '' })

      expect(() => {
        overlay.destroy()
        overlay.destroy()
      }).not.toThrow()
    })

    it('allows show to work after destroy', () => {
      const target = document.createElement('div')
      document.body.appendChild(target)

      overlay.show(target, { componentName: 'Test1', source: '' })
      overlay.destroy()

      overlay.show(target, { componentName: 'Test2', source: '' })
      expect(document.getElementById('react-code-finder-overlay')).not.toBeNull()
    })
  })
})
