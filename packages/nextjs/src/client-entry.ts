import { Inspector } from '@react-code-finder/core'

declare global {
  interface Window {
    __REACT_CODE_FINDER__: Inspector
    __REACT_CODE_FINDER_OPTIONS__?: {
      buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      outputFormat?: 'xml' | 'plain'
    }
  }
}

if (typeof window !== 'undefined') {
  const initCodeFinder = () => {
    const options = window.__REACT_CODE_FINDER_OPTIONS__ || {}
    window.__REACT_CODE_FINDER__ = new Inspector({
      enabled: true,
      buttonPosition: options.buttonPosition || 'bottom-right',
      outputFormat: options.outputFormat || 'xml',
    })
    window.__REACT_CODE_FINDER__.init()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeFinder)
  } else {
    initCodeFinder()
  }
}
