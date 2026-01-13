import { join } from 'node:path'
import type { NextConfig } from 'next'

type WebpackFn = NonNullable<NextConfig['webpack']>
type WebpackConfig = Parameters<WebpackFn>[0]
type WebpackContext = Parameters<WebpackFn>[1]

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

function getLoaderPath(): string {
  return join(__dirname, 'loader.cjs')
}

function getClientEntryPath(): string {
  return join(__dirname, 'client-entry.js')
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

          config.module.rules.push(
            {
              test: /react-jsx-dev-runtime\.development\.js$/,
              enforce: 'pre',
              use: [{ loader: getLoaderPath() }],
            },
            {
              test: /app-page(-turbo)?\.runtime\.dev\.js$/,
              enforce: 'pre',
              use: [{ loader: getLoaderPath() }],
            }
          )

          const originalEntry = config.entry
          const clientEntryPath = getClientEntryPath()

          config.entry = async () => {
            const entries =
              typeof originalEntry === 'function'
                ? await originalEntry()
                : originalEntry

            const optionsScript = `data:text/javascript,window.__REACT_CODE_FINDER_OPTIONS__=${JSON.stringify({ buttonPosition })};`

            const hasClientEntry = (entry: string) =>
              entry.includes('client-entry') || entry.includes('__REACT_CODE_FINDER_OPTIONS__')

            if (
              entries['main.js'] &&
              !entries['main.js'].some(hasClientEntry)
            ) {
              entries['main.js'].unshift(optionsScript, clientEntryPath)
            }

            if (
              entries['main-app'] &&
              Array.isArray(entries['main-app']) &&
              !entries['main-app'].some(hasClientEntry)
            ) {
              entries['main-app'].unshift(optionsScript, clientEntryPath)
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
