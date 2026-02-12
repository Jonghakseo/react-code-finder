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

# Run tests
pnpm -F @react-code-finder/core test

# Run example
pnpm -F example-vite-react19 dev
```

## Architecture

React component source code finder for development. Hover over components to see names and source locations, click to copy structured output (XML/plain) with source snippets and props for AI coding assistants. Supports area selection to capture component trees.

### Monorepo Structure

```
packages/
  core/     # @react-code-finder/core - Inspector, fiber hooking, source extraction, formatting
  vite/     # @react-code-finder/vite - Vite plugin (injects client bundle + project root)
  nextjs/   # @react-code-finder/nextjs - Next.js plugin + webpack loader + source server
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
- `src/core/source.ts` - Source location extraction, component stack building, native element name resolution
- `src/core/formatter.ts` - XML/plain text output formatting
- `src/core/props.ts` - React props serialization
- `src/core/path.ts` - Project root detection, absolute→relative path conversion
- `src/core/area-selection.ts` - Component tree extraction from selection rect
- `src/core/validate.ts` - Options validation
- `src/core/errors.ts` - Logger
- `src/client/inspector.ts` - Main Inspector class, inspect/select modes, event handling
- `src/client/overlay.ts` - Hover overlay UI (Shadow DOM)
- `src/client/toggle-button.ts` - Toggle button UI (Shadow DOM), 3 visual states
- `src/client/selection-overlay.ts` - Drag selection rectangle UI (Shadow DOM)
- `src/client/source-fetcher.ts` - Source code snippet fetching from dev server
- `src/client/clipboard.ts` - Clipboard copy
- `src/client/toast.ts` - Toast notifications
- `src/transform.ts` - JSX runtime patching for React 19

### Runtime Flow

1. **JSX Transform**: Patches `jsx-dev-runtime.js` to preserve source location in React 19's `_debugInfo`
2. **Fiber Hooking**: Intercepts `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`
3. **Source Extraction**: Traverses fiber's `_debugOwner` chain, builds component stack (max 3 levels). Native elements resolve name to nearest owner component.
4. **Click (Inspect mode)**: Fetches source snippet (±5 lines), serializes props, formats as XML/plain, copies to clipboard
5. **Drag (Area Selection mode)**: Finds all components in rect, builds tree, fetches sources, copies formatted tree to clipboard

### Interaction

- **Toggle button click**: Enable/disable inspector
- **Hover**: Show component name + source location overlay
- **Click**: Copy component info with source snippet to clipboard
- **Shift hold**: Temporarily enter area selection mode while held
- **S key**: Toggle area selection mode (persistent)
- **Escape**: Disable inspector

### Output Format (XML)

Single component click:
```xml
<component name="Button" file="src/Button.tsx" line="42">
  <props>variant={"primary"}</props>
  <source file="src/Button.tsx" lines="40-44">...</source>
  <parent name="App" file="src/App.tsx" line="10" />
</component>
```

Area selection outputs nested `<component>` tree.

### React Version Differences

- React 18: Uses `_debugSource` property
- React 19: Uses `_debugInfo` property (requires transform patch)
- React 19.2+: Requires additional parameter injection in jsxDEV chain
