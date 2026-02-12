import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { transformJsxDevRuntime } from '@react-code-finder/core/transform'

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  outputFormat?: 'xml' | 'plain'
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
  const { enabled = true, buttonPosition = 'bottom-right', outputFormat = 'xml' } = options
  let clientBundle: string | null = null
  let isServe = false

  return {
    name: 'react-code-finder',
    apply: 'serve',

    configResolved(config) {
      isServe = config.command === 'serve'
    },

    configureServer(server: ViteDevServer) {
      if (!enabled) return

      server.middlewares.use('/__rcf/source', (req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`)
        const filePath = url.searchParams.get('file')
        const line = parseInt(url.searchParams.get('line') || '0', 10)
        const contextLines = parseInt(url.searchParams.get('context') || '15', 10)

        if (!filePath) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing file parameter' }))
          return
        }

        try {
          const absolutePath = resolve(server.config.root, filePath)
          if (!absolutePath.startsWith(server.config.root)) {
            res.statusCode = 403
            res.end(JSON.stringify({ error: 'Access denied' }))
            return
          }

          const content = readFileSync(absolutePath, 'utf-8')
          const lines = content.split('\n')
          const startLine = Math.max(0, line - contextLines - 1)
          const endLine = Math.min(lines.length, line + contextLines)
          const snippet = lines.slice(startLine, endLine)

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({
            file: filePath,
            startLine: startLine + 1,
            endLine,
            content: snippet.join('\n'),
          }))
        } catch {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'File not found' }))
        }
      })
    },

    buildStart() {
      clientBundle = getClientBundle()
    },

    transform(code, id) {
      if (!enabled) return
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
                    outputFormat: '${outputFormat}',
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
