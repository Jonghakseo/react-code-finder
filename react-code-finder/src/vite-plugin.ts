import type { Plugin } from 'vite'
import type { ReactCodeFinderOptions } from './core/types'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformJsxDevRuntime } from './transform'

function getClientBundle(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const bundlePath = join(__dirname, 'client-bundle.global.js')
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
                window.__REACT_CODE_FINDER__ = window.ReactCodeFinder.init({
                  enabled: true,
                  buttonPosition: '${buttonPosition}',
                });
              }
            `,
            injectTo: 'body',
          },
        ],
      }
    },
  }
}

export default reactCodeFinder
