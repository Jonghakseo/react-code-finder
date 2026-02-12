import type { ReactCodeFinderOptions } from './types'
import { InvalidOptionError } from './errors'

const VALID_BUTTON_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const

export function validateOptions(options: ReactCodeFinderOptions): void {
  if (options.enabled !== undefined && typeof options.enabled !== 'boolean') {
    throw new InvalidOptionError('enabled', options.enabled, 'boolean')
  }

  if (options.buttonPosition !== undefined) {
    if (!VALID_BUTTON_POSITIONS.includes(options.buttonPosition as typeof VALID_BUTTON_POSITIONS[number])) {
      throw new InvalidOptionError(
        'buttonPosition',
        options.buttonPosition,
        `one of ${VALID_BUTTON_POSITIONS.map(p => `"${p}"`).join(', ')}`
      )
    }
  }

  if (options.maxDepth !== undefined) {
    if (typeof options.maxDepth !== 'number' || options.maxDepth < 1 || !Number.isInteger(options.maxDepth)) {
      throw new InvalidOptionError('maxDepth', options.maxDepth, 'positive integer')
    }
  }

  if (options.skipAnonymous !== undefined && typeof options.skipAnonymous !== 'boolean') {
    throw new InvalidOptionError('skipAnonymous', options.skipAnonymous, 'boolean')
  }

  if (options.debug !== undefined && typeof options.debug !== 'boolean') {
    throw new InvalidOptionError('debug', options.debug, 'boolean')
  }

  if (options.showNoSource !== undefined && typeof options.showNoSource !== 'boolean') {
    throw new InvalidOptionError('showNoSource', options.showNoSource, 'boolean')
  }

  if (options.outputFormat !== undefined) {
    const validFormats = ['xml', 'plain'] as const
    if (!validFormats.includes(options.outputFormat as typeof validFormats[number])) {
      throw new InvalidOptionError('outputFormat', options.outputFormat, '"xml" or "plain"')
    }
  }
}
