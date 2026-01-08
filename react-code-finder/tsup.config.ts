import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      'index': 'src/index.ts',
      'vite-plugin': 'src/vite-plugin.ts',
      'next-plugin': 'src/next-plugin.ts',
      'transform': 'src/transform.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    shims: true,
    external: ['vite', 'next'],
  },
  {
    entry: {
      'client-bundle': 'src/client-entry.ts',
    },
    format: ['iife'],
    globalName: 'ReactCodeFinder',
    minify: true,
    clean: false,
  },
  {
    entry: {
      'jsx-transform-loader': 'src/jsx-transform-loader.cts',
    },
    format: ['cjs'],
    clean: false,
  },
])
