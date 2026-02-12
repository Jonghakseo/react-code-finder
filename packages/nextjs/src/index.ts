import { join } from 'node:path'
import type { NextConfig } from 'next'
import { startSourceServer } from './source-server'

const SOURCE_SERVER_PORT = 7799

type WebpackFn = NonNullable<NextConfig['webpack']>
type WebpackConfig = Parameters<WebpackFn>[0]
type WebpackContext = Parameters<WebpackFn>[1]

export interface ReactCodeFinderOptions {
  enabled?: boolean
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  outputFormat?: 'xml' | 'plain'
}

function getLoaderPath(): string {
  return join(__dirname, 'loader.cjs')
}

function getClientEntryPath(): string {
  return join(__dirname, 'client-entry.js')
}

export function withReactCodeFinder(options: ReactCodeFinderOptions = {}) {
  const { enabled = true, buttonPosition = 'bottom-right', outputFormat = 'xml' } = options

  return (nextConfig: NextConfig = {}): NextConfig => {
    if (!enabled || process.env.NODE_ENV === 'production') {
      return nextConfig
    }

    return {
      ...nextConfig,

      webpack(config: WebpackConfig, context: WebpackContext) {
        if (context.dev && context.isServer) {
          startSourceServer({ port: SOURCE_SERVER_PORT, root: process.cwd() })
        }

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

            const optionsScript = `data:text/javascript,window.__REACT_CODE_FINDER_OPTIONS__=${JSON.stringify({ buttonPosition, outputFormat })};window.__RCF_SOURCE_ENDPOINT__='http://localhost:${SOURCE_SERVER_PORT}/source';window.__RCF_PROJECT_ROOT__='${process.cwd().replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';`

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
