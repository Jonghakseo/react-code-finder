import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { transformJsxDevRuntime } from '@react-code-finder/core/transform'

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

function getClientBundle(): string {
  try {
    const require = createRequire(import.meta.url)
    const corePath = require.resolve('@react-code-finder/core')
    const bundlePath = join(dirname(corePath), 'client-bundle.global.js')
    return readFileSync(bundlePath, 'utf-8')
  } catch {
    return ''
  }
}

export function reactCodeFinder(options: ReactCodeFinderOptions = {}): Plugin {
  const { enabled = true, buttonPosition = 'bottom-right' } = options
  let clientBundle: string | null = null
  let isServe = false

  return {
    name: 'react-code-finder',
    apply: 'serve',

    configResolved(config) {
      isServe = config.command === 'serve'
    },

    buildStart() {
      clientBundle = getClientBundle()
    },

    transform(code, id) {
      if (!isServe) return
      if (!id.includes('jsx-dev-runtime')) return

      return transformJsxDevRuntime(code)
    },

    transformIndexHtml(html) {
      if (!enabled) return html

      const bundle = clientBundle || getClientBundle()
      if (!bundle) {
        console.warn('[react-code-finder] Client bundle not found')
        return html
      }

      return {
        html,
        tags: [
          {
            tag: 'script',
            children: `
              ${bundle}
              if (typeof window !== 'undefined' && window.ReactCodeFinder) {
                var initCodeFinder = function() {
                  window.__REACT_CODE_FINDER_INSTANCE__ = window.ReactCodeFinder.init({
                    enabled: true,
                    buttonPosition: '${buttonPosition}',
                  });
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initCodeFinder);
                } else {
                  initCodeFinder();
                }
              }
            `,
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default reactCodeFinder
