import { join } from 'node:path'

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

interface NextConfig {
  webpack?: (config: WebpackConfig, context: WebpackContext) => WebpackConfig
  [key: string]: unknown
}

interface WebpackConfig {
  entry: WebpackEntry | (() => Promise<WebpackEntry>)
  module?: {
    rules?: WebpackRule[]
  }
  [key: string]: unknown
}

interface WebpackEntry {
  [key: string]: string[]
}

interface WebpackContext {
  dev: boolean
  isServer: boolean
  [key: string]: unknown
}

interface WebpackRule {
  test?: RegExp
  enforce?: 'pre' | 'post'
  use?: Array<{ loader: string }>
  [key: string]: unknown
}

function getLoaderPath(): string {
  return join(__dirname, 'loader.cjs')
}

export function withReactCodeFinder(options: ReactCodeFinderOptions = {}) {
  const { enabled = true, buttonPosition = 'bottom-right' } = options

  return (nextConfig: NextConfig = {}): NextConfig => {
    if (!enabled || process.env.NODE_ENV === 'production') {
      return nextConfig
    }

    return {
      ...nextConfig,

      webpack(config: WebpackConfig, context: WebpackContext) {
        if (context.dev && !context.isServer) {
          if (!config.module) {
            config.module = {}
          }
          if (!config.module.rules) {
            config.module.rules = []
          }

          config.module.rules.push({
            test: /react-jsx-dev-runtime\.development\.js$/,
            enforce: 'pre',
            use: [{ loader: getLoaderPath() }],
          })

          const originalEntry = config.entry

          config.entry = async () => {
            const entries =
              typeof originalEntry === 'function'
                ? await originalEntry()
                : originalEntry

            const clientEntry = `
              (function() {
                if (typeof window !== 'undefined') {
                  import('@react-code-finder/core').then(({ Inspector }) => {
                    window.__REACT_CODE_FINDER__ = new Inspector({
                      enabled: true,
                      buttonPosition: '${buttonPosition}',
                    });
                    window.__REACT_CODE_FINDER__.init();
                  });
                }
              })();
            `

            if (
              entries['main.js'] &&
              !entries['main.js'].includes('@react-code-finder')
            ) {
              entries['main.js'].unshift(
                `data:text/javascript,${encodeURIComponent(clientEntry)}`
              )
            }

            return entries
          }
        }

        return nextConfig.webpack?.(config, context) ?? config
      },
    }
  }
}

export default withReactCodeFinder
