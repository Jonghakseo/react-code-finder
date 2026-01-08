import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      'index': 'src/index.ts',
      'transform': 'src/transform.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
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
])
