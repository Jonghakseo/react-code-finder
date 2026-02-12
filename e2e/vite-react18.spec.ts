import { test, expect } from '@playwright/test'
import {
  waitForInspector,
  enableInspector,
  clickAndCopy,
  getOverlayHostStyle,
  dragSelect,
} from './helpers'

test.describe('Vite React 18 - Source Endpoint', () => {
  test('returns source code for valid file', async ({ request }) => {
    const response = await request.get('/__rcf/source?file=src/App.tsx&line=8&context=5')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.file).toBe('src/App.tsx')
    expect(data.content).toContain('function App')
  })

  test('returns source for component file', async ({ request }) => {
    const response = await request.get('/__rcf/source?file=src/components/Button.tsx&line=9&context=5')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.content).toContain('Button')
  })

  test('blocks path traversal', async ({ request }) => {
    const response = await request.get('/__rcf/source?file=../package.json&line=1')
    expect(response.status()).toBe(403)
  })
})

test.describe('Vite React 18 - Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForInspector(page)
  })

  test('toggle button is rendered', async ({ page }) => {
    const toggleButton = page.locator('#react-code-finder-toggle-button')
    await expect(toggleButton).toBeAttached()
  })

  test('global API is available', async ({ page }) => {
    const hasAPI = await page.evaluate(() => (window as any).__REACT_CODE_FINDER__ !== undefined)
    expect(hasAPI).toBeTruthy()
  })

  test('hover shows overlay', async ({ page }) => {
    await enableInspector(page)
    await page.hover('button:has-text("Secondary Button")')
    await page.waitForTimeout(500)
    const style = await getOverlayHostStyle(page)
    expect(style).toContain('position: absolute')
    expect(style).toContain('z-index: 999999')
  })
})

test.describe('Vite React 18 - Click Copy (Props + Source + XML)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForInspector(page)
    await enableInspector(page)
  })

  test('click copies XML with component name', async ({ page }) => {
    const content = await clickAndCopy(page, 'button:has-text("Secondary Button")')
    expect(content).toContain('<component')
    expect(content).toContain('name="Button"')
    expect(content).toContain('</component>')
  })

  test('XML output includes props', async ({ page }) => {
    const content = await clickAndCopy(page, 'button:has-text("Secondary Button")')
    expect(content).toContain('variant')
  })

  test('XML output includes source snippet', async ({ page }) => {
    const content = await clickAndCopy(page, 'button:has-text("Secondary Button")')
    expect(content).toContain('<source')
    expect(content).toContain('</source>')
  })

  test('XML output includes parent component', async ({ page }) => {
    const content = await clickAndCopy(page, 'button:has-text("Secondary Button")')
    expect(content).toContain('<parent')
    expect(content).toContain('name="App"')
  })
})

test.describe('Vite React 18 - Area Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForInspector(page)
    await enableInspector(page)
  })

  test('drag-select copies component tree', async ({ page }) => {
    await page.keyboard.press('s')
    await page.waitForTimeout(300)

    const btn = page.locator('button:has-text("Click Me")')
    const box = await btn.boundingBox()
    expect(box).not.toBeNull()

    const content = await dragSelect(
      page,
      box!.x - 10,
      box!.y - 10,
      box!.x + box!.width + 250,
      box!.y + box!.height + 10
    )
    expect(content).toContain('Button')
  })
})
