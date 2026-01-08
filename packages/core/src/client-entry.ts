import { Inspector } from './client/inspector'
import type { ReactCodeFinderOptions } from './core/types'

export function init(options: ReactCodeFinderOptions = {}) {
  const inspector = new Inspector(options)
  inspector.init()
  return inspector
}

export { Inspector }
