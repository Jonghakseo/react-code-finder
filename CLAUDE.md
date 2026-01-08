# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm -F @react-code-finder/core build
pnpm -F @react-code-finder/vite build
pnpm -F @react-code-finder/nextjs build

# Run example
pnpm -F example-vite-react19 dev
```

## Architecture

React component source code finder for development. Displays component names and source locations on hover, copies to clipboard on click. Copies component stack trace (up to 3 levels) for AI coding assistant context.

### Monorepo Structure

```
packages/
  core/     # @react-code-finder/core - Inspector, fiber hooking, source extraction
  vite/     # @react-code-finder/vite - Vite plugin
  nextjs/   # @react-code-finder/nextjs - Next.js plugin + webpack loader
examples/
  vite-react18/
  vite-react19/
  nextjs-react18/
  nextjs-react19/
```

### Package Dependencies

```
@react-code-finder/vite   → @react-code-finder/core
@react-code-finder/nextjs → @react-code-finder/core
```

### Core Package (`packages/core`)

- `src/core/types.ts` - Fiber, SourceLocation types
- `src/core/fiber.ts` - React DevTools hook interception, fiber tree traversal
- `src/core/source.ts` - Source location extraction, component stack building
- `src/client/inspector.ts` - Main Inspector class, event handling
- `src/client/overlay.ts` - Hover overlay UI
- `src/transform.ts` - JSX runtime patching for React 19

### Runtime Flow

1. **JSX Transform**: Patches `jsx-dev-runtime.js` to preserve source location in React 19's `_debugInfo`
2. **Fiber Hooking**: Intercepts `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`
3. **Source Extraction**: Traverses fiber's `_debugOwner` chain, builds component stack (max 3 levels)
4. **Click Handler**: Copies formatted stack trace to clipboard

### React Version Differences

- React 18: Uses `_debugSource` property
- React 19: Uses `_debugInfo` property (requires transform patch)
- React 19.2+: Requires additional parameter injection in jsxDEV chain
