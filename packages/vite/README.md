# @react-code-finder/vite

Vite plugin for react-code-finder. Inspect React components in your browser and copy their source locations to clipboard with a single click.

Perfect for passing UI context to AI coding assistants like Claude Code, Cursor, or GitHub Copilot.

## Features

- Hover over any component to see its name and source location
- Click to copy source location to clipboard (e.g., `src/components/Button.tsx:42:10`)
- Supports React 18 & 19
- Zero runtime overhead in production

## Installation

```bash
npm install @react-code-finder/vite --save-dev
```

## Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactCodeFinder } from '@react-code-finder/vite'

export default defineConfig({
  plugins: [react(), reactCodeFinder()],
})
```

## Options

```typescript
reactCodeFinder({
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
reactCodeFinder({
  debug: true,
})
```

This will log:
- Fiber tree traversal details
- Component source extraction
- DevTools hook initialization status

## Requirements

- Vite >= 4.0.0
- React 18 or 19

## License

MIT
