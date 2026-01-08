import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactCodeFinder } from 'react-code-finder/vite'

export default defineConfig({
  plugins: [react(), reactCodeFinder()],
})
