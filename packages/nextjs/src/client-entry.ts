import { Inspector } from '@react-code-finder/core'

declare global {
  interface Window {
    __REACT_CODE_FINDER__: Inspector
    __REACT_CODE_FINDER_OPTIONS__?: {
      buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    }
  }
}

if (typeof window !== 'undefined') {
  const options = window.__REACT_CODE_FINDER_OPTIONS__ || {}
  window.__REACT_CODE_FINDER__ = new Inspector({
    enabled: true,
    buttonPosition: options.buttonPosition || 'bottom-right',
  })
  window.__REACT_CODE_FINDER__.init()
}
