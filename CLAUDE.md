# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Build the library (in react-code-finder/)
cd react-code-finder && pnpm build

# Watch mode for development
cd react-code-finder && pnpm dev
```

## Architecture

React component source code finder for development. Displays component names and source locations on hover, copies to clipboard on click.

### Structure

- `react-code-finder/` - Main library package
- `examples/` - Example apps (nextjs-react18, nextjs-react19, vite-react18, vite-react19)

### Core Modules

**Build System (tsup)**
- `index` - Main entry, exports `Inspector` class
- `vite-plugin` - Vite plugin entry (`react-code-finder/vite`)
- `next-plugin` - Next.js plugin entry (`react-code-finder/next`)
- `client-bundle` - IIFE bundle for browser injection
- `jsx-transform-loader` - Webpack loader for Next.js

**Runtime Flow**

1. **JSX Transform** (`transform.ts`): Patches `jsx-dev-runtime.js` to preserve source location in React 19's `_debugInfo` (React 18 uses `_debugSource` natively)

2. **Fiber Hooking** (`core/fiber.ts`): Intercepts `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot` to track fiber tree updates and map DOM elements to fibers

3. **Source Extraction** (`core/source.ts`): Traverses fiber's `_debugOwner` chain to find user components (excluding node_modules) and extract `SourceLocation`

4. **Inspector** (`client/inspector.ts`): Manages hover overlay, click-to-copy, and toggle button UI

### React Version Differences

- React 18: Uses `_debugSource` property
- React 19: Uses `_debugInfo` property (requires transform patch)
- React 19.2+: Requires additional parameter injection in jsxDEV chain
