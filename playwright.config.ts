import { defineConfig, devices } from '@playwright/test'

const group = process.env.E2E_GROUP || 'vite'

const groups: Record<string, { webServer: any[]; projects: any[] }> = {
  vite: {
    webServer: [
      {
        command: 'pnpm --dir examples/vite-react19 exec vite --port 5173',
        port: 5173,
        reuseExistingServer: true,
        timeout: 30_000,
      },
      {
        command: 'pnpm --dir examples/vite-react18 exec vite --port 5174',
        port: 5174,
        reuseExistingServer: true,
        timeout: 30_000,
      },
    ],
    projects: [
      {
        name: 'vite-react19',
        use: { baseURL: 'http://localhost:5173' },
        testMatch: 'vite-react19.spec.ts',
      },
      {
        name: 'vite-react18',
        use: { baseURL: 'http://localhost:5174' },
        testMatch: 'vite-react18.spec.ts',
      },
    ],
  },
  nextjs: {
    webServer: [
      {
        command: 'pnpm --dir examples/nextjs-react19 exec next dev -p 3010',
        port: 3010,
        reuseExistingServer: true,
        timeout: 120_000,
      },
    ],
    projects: [
      {
        name: 'nextjs-react19',
        use: { baseURL: 'http://localhost:3010' },
        testMatch: 'nextjs-react19.spec.ts',
      },
    ],
  },
  'nextjs-app': {
    webServer: [
      {
        command: 'pnpm --dir examples/nextjs-app-router exec next dev -p 3011',
        port: 3011,
        reuseExistingServer: true,
        timeout: 120_000,
      },
    ],
    projects: [
      {
        name: 'nextjs-app-router',
        use: { baseURL: 'http://localhost:3011' },
        testMatch: 'nextjs-app-router.spec.ts',
      },
    ],
  },
}

const selected = groups[group] || groups.vite

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: selected.webServer,
  projects: selected.projects,
})
