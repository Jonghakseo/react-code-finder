import { test, expect } from '@playwright/test'
import {
  waitForInspector,
  enableInspector,
  clickAndCopy,
  getOverlayHostStyle,
  dragSelect,
} from './helpers'

test.describe('Next.js App Router - Inspector', () => {
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

  test('hover shows overlay on client component', async ({ page }) => {
    await enableInspector(page)
    await page.hover('button:has-text("Secondary Button")')
    await page.waitForTimeout(500)
    const style = await getOverlayHostStyle(page)
    expect(style).toContain('position: absolute')
    expect(style).toContain('z-index: 999999')
  })
})

test.describe('Next.js App Router - Click Copy (Props + XML)', () => {
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

  test('click on Card copies Card info', async ({ page }) => {
    const content = await clickAndCopy(page, 'h3:has-text("Card 1")')
    expect(content).toContain('Card')
  })
})

test.describe('Next.js App Router - Area Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForInspector(page)
    await enableInspector(page)
  })

  test('drag-select copies component tree', async ({ page }) => {
    await page.keyboard.press('s')
    await page.waitForTimeout(300)

    const btn = page.locator('button:has-text("Primary Button")')
    const box = await btn.boundingBox()
    expect(box).not.toBeNull()

    const content = await dragSelect(
      page,
      box!.x - 10,
      box!.y - 10,
      box!.x + box!.width + 300,
      box!.y + box!.height + 10
    )
    expect(content).toContain('Button')
  })
})
