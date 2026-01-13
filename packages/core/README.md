# @react-code-finder/core

Internal core package for react-code-finder. This package is not intended for direct use.

## For Users

Please use one of the following packages instead:

- **Vite**: [@react-code-finder/vite](https://www.npmjs.com/package/@react-code-finder/vite)
- **Next.js**: [@react-code-finder/nextjs](https://www.npmjs.com/package/@react-code-finder/nextjs)

## For Contributors

This package contains the core functionality:

- `src/core/fiber.ts` - React DevTools hook interception, fiber tree traversal
- `src/core/source.ts` - Source location extraction, component stack building
- `src/client/inspector.ts` - Main Inspector class, event handling
- `src/client/overlay.ts` - Hover overlay UI
- `src/transform.ts` - JSX runtime patching for React 19

## License

MIT
