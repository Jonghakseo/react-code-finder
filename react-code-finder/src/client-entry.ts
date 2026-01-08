import { Inspector } from './client/inspector'

export { Inspector }

export function init(options: { enabled?: boolean; buttonPosition?: string } = {}) {
  const inspector = new Inspector({
    enabled: options.enabled ?? true,
    buttonPosition: (options.buttonPosition as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') ?? 'bottom-right',
  })
  inspector.init()
  return inspector
}
