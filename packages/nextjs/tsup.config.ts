import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    external: ['next', '@react-code-finder/core'],
  },
  {
    entry: ['src/loader.cts'],
    format: ['cjs'],
    clean: false,
  },
])
