export class ReactCodeFinderError extends Error {
  constructor(message: string) {
    super(`[react-code-finder] ${message}`)
    this.name = 'ReactCodeFinderError'
  }
}

export class InvalidOptionError extends ReactCodeFinderError {
  constructor(option: string, value: unknown, expected: string) {
    super(`Invalid option "${option}": received ${JSON.stringify(value)}, expected ${expected}`)
    this.name = 'InvalidOptionError'
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private debugMode = false
  private prefix = '[react-code-finder]'

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  debug(...args: unknown[]): void {
    if (this.debugMode) {
      console.log(this.prefix, ...args)
    }
  }

  info(...args: unknown[]): void {
    console.info(this.prefix, ...args)
  }

  warn(...args: unknown[]): void {
    console.warn(this.prefix, ...args)
  }

  error(...args: unknown[]): void {
    console.error(this.prefix, ...args)
  }

  log(level: LogLevel, ...args: unknown[]): void {
    this[level](...args)
  }
}

export const logger = new Logger()
