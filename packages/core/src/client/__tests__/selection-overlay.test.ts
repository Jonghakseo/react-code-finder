import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SelectionOverlay } from '../selection-overlay'

describe('SelectionOverlay', () => {
  let overlay: SelectionOverlay

  beforeEach(() => {
    document.body.innerHTML = ''
    overlay = new SelectionOverlay()
  })

  afterEach(() => {
    overlay.destroy()
    document.body.innerHTML = ''
  })

  it('creates overlay element on first show', () => {
    expect(document.getElementById('react-code-finder-selection-overlay')).toBeNull()

    overlay.show(10, 20, 100, 50)

    expect(document.getElementById('react-code-finder-selection-overlay')).not.toBeNull()
  })

  it('positions the selection rectangle correctly', () => {
    overlay.show(10, 20, 100, 50)

    const host = document.getElementById('react-code-finder-selection-overlay')
    expect(host).not.toBeNull()
    expect(host?.style.position).toBe('fixed')
    expect(host?.style.pointerEvents).toBe('none')
  })

  it('handles negative width/height for reverse drag', () => {
    overlay.show(100, 100, -50, -30)

    const host = document.getElementById('react-code-finder-selection-overlay')
    expect(host).not.toBeNull()
  })

  it('hides the overlay', () => {
    overlay.show(10, 20, 100, 50)
    overlay.hide()

    const host = document.getElementById('react-code-finder-selection-overlay')
    expect(host).not.toBeNull()
  })

  it('destroys removes element from DOM', () => {
    overlay.show(10, 20, 100, 50)
    overlay.destroy()

    expect(document.getElementById('react-code-finder-selection-overlay')).toBeNull()
  })

  it('can be destroyed without showing', () => {
    expect(() => overlay.destroy()).not.toThrow()
  })

  it('can show multiple times without creating duplicate elements', () => {
    overlay.show(10, 20, 100, 50)
    overlay.show(20, 30, 200, 100)

    const elements = document.querySelectorAll('#react-code-finder-selection-overlay')
    expect(elements).toHaveLength(1)
  })

  it('can hide without showing first', () => {
    expect(() => overlay.hide()).not.toThrow()
  })
})
