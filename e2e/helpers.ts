import { Page } from '@playwright/test'

export async function waitForInspector(page: Page) {
  await page.waitForFunction(
    () => (window as any).__REACT_CODE_FINDER__ !== undefined,
    { timeout: 15_000 }
  )
  await page.waitForTimeout(500)
}

export async function enableInspector(page: Page) {
  await page.evaluate(() => {
    ;(window as any).__REACT_CODE_FINDER__?.enable()
  })
  await page.waitForTimeout(300)
}

export async function clearClipboard(page: Page) {
  await page.evaluate(() => navigator.clipboard.writeText(''))
}

export async function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText())
}

export async function waitForClipboard(page: Page, timeout = 8000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const content = await readClipboard(page)
    if (content.length > 0) return content
    await page.waitForTimeout(200)
  }
  throw new Error(`Clipboard content not available after ${timeout}ms`)
}

export async function clickAndCopy(page: Page, selector: string): Promise<string> {
  await clearClipboard(page)
  await page.click(selector)
  return waitForClipboard(page)
}

export async function getOverlayHostStyle(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.getElementById('react-code-finder-overlay')
    return el?.style.cssText || ''
  })
}

export async function dragSelect(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<string> {
  await clearClipboard(page)
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(endX, endY, { steps: 10 })
  await page.mouse.up()
  return waitForClipboard(page, 10_000)
}
