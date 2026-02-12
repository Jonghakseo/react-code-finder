import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchSourceCode } from '../source-fetcher'

describe('fetchSourceCode', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    delete (window as Record<string, unknown>).__RCF_SOURCE_ENDPOINT__
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed SourceSnippet on success', async () => {
    const mockResponse = {
      file: 'src/App.tsx',
      startLine: 1,
      endLine: 15,
      content: 'function App() { return <div /> }',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await fetchSourceCode('src/App.tsx', 10)

    expect(result).toEqual(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__rcf/source?file=src%2FApp.tsx&line=10&context=5')
    )
  })

  it('returns null on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })

    const result = await fetchSourceCode('nonexistent.tsx', 1)
    expect(result).toBeNull()
  })

  it('returns null on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await fetchSourceCode('src/App.tsx', 1)
    expect(result).toBeNull()
  })

  it('uses custom endpoint from window.__RCF_SOURCE_ENDPOINT__', async () => {
    ;(window as Record<string, unknown>).__RCF_SOURCE_ENDPOINT__ = 'http://localhost:7799/source'

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ file: 'test', startLine: 1, endLine: 10, content: '' }),
    })

    await fetchSourceCode('src/App.tsx', 10)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:7799/source?')
    )
  })

  it('uses default endpoint when no custom endpoint set', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ file: 'test', startLine: 1, endLine: 10, content: '' }),
    })

    await fetchSourceCode('src/App.tsx', 10)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/__rcf/source?')
    )
  })

  it('passes custom contextLines parameter', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ file: 'test', startLine: 1, endLine: 10, content: '' }),
    })

    await fetchSourceCode('src/App.tsx', 10, 30)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('context=30')
    )
  })
})
