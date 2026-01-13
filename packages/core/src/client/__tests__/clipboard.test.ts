import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { copyToClipboard } from '../clipboard'

describe('copyToClipboard', () => {
  let originalClipboard: Clipboard | undefined

  beforeEach(() => {
    originalClipboard = navigator.clipboard
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      })
    }
  })

  describe('Clipboard API', () => {
    it('returns true when Clipboard API succeeds', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      const result = await copyToClipboard('test text')

      expect(writeTextMock).toHaveBeenCalledWith('test text')
      expect(result).toBe(true)
    })

    it('falls back when Clipboard API throws', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      // Mock execCommand for fallback
      document.execCommand = vi.fn().mockReturnValue(true)

      const result = await copyToClipboard('test text')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(result).toBe(true)
    })

    it('falls back when Clipboard API is undefined', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      document.execCommand = vi.fn().mockReturnValue(true)

      const result = await copyToClipboard('test text')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(result).toBe(true)
    })

    it('falls back when writeText is undefined', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {},
        writable: true,
        configurable: true,
      })

      document.execCommand = vi.fn().mockReturnValue(true)

      const result = await copyToClipboard('test text')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(result).toBe(true)
    })
  })

  describe('Fallback copy', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })

    it('creates textarea element', async () => {
      document.execCommand = vi.fn().mockReturnValue(true)
      const createElementSpy = vi.spyOn(document, 'createElement')

      await copyToClipboard('test text')

      expect(createElementSpy).toHaveBeenCalledWith('textarea')
    })

    it('appends textarea to body and removes it', async () => {
      document.execCommand = vi.fn().mockReturnValue(true)

      await copyToClipboard('test text')

      // Textarea should be removed after copy
      const textareas = document.querySelectorAll('textarea')
      expect(textareas.length).toBe(0)
    })

    it('calls execCommand with copy', async () => {
      document.execCommand = vi.fn().mockReturnValue(true)

      await copyToClipboard('test text')

      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })

    it('returns true when execCommand succeeds', async () => {
      document.execCommand = vi.fn().mockReturnValue(true)

      const result = await copyToClipboard('test text')

      expect(result).toBe(true)
    })

    it('returns false when execCommand fails', async () => {
      document.execCommand = vi.fn().mockReturnValue(false)

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)
    })

    it('returns false when execCommand throws', async () => {
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('execCommand failed')
      })

      const result = await copyToClipboard('test text')

      expect(result).toBe(false)
    })

    it('removes textarea even when execCommand throws', async () => {
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('execCommand failed')
      })

      await copyToClipboard('test text')

      const textareas = document.querySelectorAll('textarea')
      expect(textareas.length).toBe(0)
    })
  })
})
