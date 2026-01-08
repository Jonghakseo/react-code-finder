# react-code-finder

English | [한국어](./README-ko.md)

Inspect React components in your browser and copy their source locations to clipboard with a single click.

Perfect for passing UI context to AI coding assistants like Claude Code, Cursor, or GitHub Copilot — just hover, click, and paste the component path directly into your prompt.

## Features

- Hover over any component to see its name and source location
- Click to copy source location to clipboard (e.g., `src/components/Button.tsx:42:10`)
- Supports React 18 & 19
- Works with Vite and Next.js

## Installation

```bash
npm install react-code-finder --save-dev
# or
pnpm add react-code-finder -D
# or
yarn add react-code-finder --dev
```

## Usage

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactCodeFinder } from 'react-code-finder/vite'

export default defineConfig({
  plugins: [react(), reactCodeFinder()],
})
```

### Next.js

```javascript
// next.config.js
const { withReactCodeFinder } = require('react-code-finder/next')

module.exports = withReactCodeFinder()({
  // your next.js config
})
```

Or with ES Modules:

```javascript
// next.config.mjs
import { withReactCodeFinder } from 'react-code-finder/next'

export default withReactCodeFinder()({
  // your next.js config
})
```

## Options

```typescript
interface ReactCodeFinderOptions {
  // Enable/disable the inspector (default: true)
  enabled?: boolean
  // Toggle button position (default: 'bottom-right')
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}
```

### Example

```typescript
// Vite
reactCodeFinder({
  enabled: true,
  buttonPosition: 'bottom-left',
})

// Next.js
withReactCodeFinder({
  enabled: true,
  buttonPosition: 'bottom-left',
})({
  // next.js config
})
```

## How It Works

1. A toggle button appears at the bottom-right corner when the dev server starts.
2. Click the button to activate Inspector mode.
3. Hover over components to see their names and source locations in an overlay.
4. Click to copy the source location to your clipboard.

## Limitations

- Development mode only (disabled in production builds)
- Next.js Turbopack not supported (Webpack only)
- React Server Components not supported (Client Components only)

## License

MIT
