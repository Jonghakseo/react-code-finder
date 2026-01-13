import { describe, it, expect } from 'vitest'
import { transformJsxDevRuntime } from '../transform'

describe('transformJsxDevRuntime', () => {
  it('returns undefined when _source already exists', () => {
    const code = `
      function jsxDEV(type, props, _source) {
        return { type, props, _source };
      }
    `

    expect(transformJsxDevRuntime(code)).toBeUndefined()
  })

  it('returns undefined when _debugInfo is not present', () => {
    const code = `
      function jsxDEV(type, props) {
        return { type, props };
      }
    `

    expect(transformJsxDevRuntime(code)).toBeUndefined()
  })

  it('returns undefined when value: null is not found after _debugInfo', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: someValue
      });
    `

    expect(transformJsxDevRuntime(code)).toBeUndefined()
  })

  it('transforms value: null to value: source', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: null
      });
      function ReactElement(type, key, self, source, owner) {}
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('value: source')
    expect(result).not.toContain('value: null')
  })

  it('adds source parameter to maybeKey, isStaticChildren pattern', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function jsxDEV(type, config, maybeKey, isStaticChildren) {
        return element;
      }
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('maybeKey, isStaticChildren, source')
  })

  it('adds source parameter after debugTask for React 19.2+', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function jsxDEV(type, config, maybeKey, debugStack, debugTask) {
        return element;
      }
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('debugTask, source')
  })

  it('does not duplicate source parameter if already present', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function jsxDEV(type, config, source, debugStack, debugTask) {
        return element;
      }
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    const sourceCount = (result!.match(/source/g) || []).length
    expect(sourceCount).toBe(2)
  })

  it('returns early for ReactElement with source parameter', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function ReactElement(type, key, self, source, owner) {
        return element;
      }
      function jsxDEV(type, config, maybeKey, isStaticChildren) {
        return element;
      }
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('value: source')
    expect(result).not.toContain('maybeKey, isStaticChildren, source')
  })

  it('handles multiple occurrences of patterns', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function jsxDEV1(type, config, maybeKey, isStaticChildren) {}
      function jsxDEV2(type, config, maybeKey, isStaticChildren) {}
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    const occurrences = result!.match(/maybeKey, isStaticChildren, source/g) || []
    expect(occurrences.length).toBe(2)
  })

  it('handles whitespace variations in patterns', () => {
    const code = `
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function jsxDEV(type, config, maybeKey,   isStaticChildren) {}
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('source')
  })

  it('preserves surrounding code', () => {
    const code = `
      // Header comment
      const REACT_ELEMENT_TYPE = Symbol.for('react.element');
      Object.defineProperty(element, "_debugInfo", {
        value: null
      });
      function ReactElement(type, key, self, source, owner) {}
      // Footer comment
      export { jsxDEV };
    `

    const result = transformJsxDevRuntime(code)

    expect(result).toBeDefined()
    expect(result).toContain('// Header comment')
    expect(result).toContain('// Footer comment')
    expect(result).toContain('REACT_ELEMENT_TYPE')
    expect(result).toContain('export { jsxDEV }')
  })
})
