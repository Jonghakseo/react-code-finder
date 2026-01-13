# @react-code-finder/nextjs

Next.js plugin for react-code-finder. Inspect React components in your browser and copy their source locations to clipboard with a single click.

Perfect for passing UI context to AI coding assistants like Claude Code, Cursor, or GitHub Copilot.

## Features

- Hover over any component to see its name and source location
- Click to copy source location to clipboard (e.g., `src/components/Button.tsx:42:10`)
- Supports React 18 & 19
- Works with Pages Router & App Router
- React Server Components supported (file path only, no line numbers)
- Zero runtime overhead in production

## Installation

```bash
npm install @react-code-finder/nextjs --save-dev
```

## Usage

### CommonJS (next.config.js)

```javascript
const { withReactCodeFinder } = require('@react-code-finder/nextjs')

module.exports = withReactCodeFinder()({
  // your next.js config
})
```

### ES Modules (next.config.mjs)

```javascript
import { withReactCodeFinder } from '@react-code-finder/nextjs'

export default withReactCodeFinder()({
  // your next.js config
})
```

### TypeScript (next.config.ts)

```typescript
import type { NextConfig } from 'next'
import { withReactCodeFinder } from '@react-code-finder/nextjs'

const nextConfig: NextConfig = {
  // your next.js config
}

export default withReactCodeFinder()(nextConfig)
```

## Options

```typescript
withReactCodeFinder({
  // Enable/disable the inspector (default: process.env.NODE_ENV === 'development')
  enabled: true,

  // Toggle button position (default: 'bottom-right')
  buttonPosition: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

  // Maximum component stack depth to copy (default: 5)
  maxDepth: 5,

  // Skip anonymous/unknown components in stack trace (default: true)
  skipAnonymous: true,

  // Enable debug logging to console (default: false)
  debug: false,

  // Show overlay for components without source info (default: false)
  showNoSource: false,
})({
  // next.js config
})
```

## How It Works

1. A toggle button appears at the configured position when the dev server starts.
2. Click the button to activate Inspector mode.
3. Hover over components to see their names and source locations in an overlay.
4. Click to copy the source location to your clipboard.

## Programmatic API

Control the inspector from browser console or your code:

```typescript
// Enable inspector
window.__REACT_CODE_FINDER__.enable()

// Disable inspector
window.__REACT_CODE_FINDER__.disable()

// Toggle inspector
window.__REACT_CODE_FINDER__.toggle()

// Check if inspector is enabled
window.__REACT_CODE_FINDER__.isEnabled
```

## Troubleshooting

Enable `debug: true` to see detailed logs in the browser console:

```typescript
withReactCodeFinder({
  debug: true,
})({
  // next.js config
})
```

This will log:
- Fiber tree traversal details
- Component source extraction
- DevTools hook initialization status

## Limitations

- **Turbopack not supported**: Only Webpack bundler is supported. Do not use `next dev --turbo`.
- **React Server Components**: RSC components show file path only (no line numbers). Client Components work fully.
- **Development mode only**: Disabled in production builds.

## Requirements

- Next.js >= 12.0.0
- React 18 or 19

## License

MIT
