// Rendered-page capture used by capture.sh. Browser/network failures exit 75;
// page or rendering defects exit 1.
import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'

const url = process.env.CAPTURE_URL
const outputDir = process.env.CAPTURE_DIR
const projectDir = process.env.PROJECT_DIR || '/home/runner/work/PlayGround/PlayGround'

function fail(message, exitCode = 1) {
  return Object.assign(new Error(message), { exitCode })
}

const temporary = message => fail(message, 75)

async function timed(label, fn) {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    console.error(`[capture] ${label} ${(performance.now() - start).toFixed(0)}ms`)
  }
}

if (!url || !outputDir) {
  console.error('Set CAPTURE_URL and CAPTURE_DIR.')
  process.exit(1)
}
if (outputDir === projectDir || outputDir.startsWith(projectDir + '/')) {
  console.error('CAPTURE_DIR must be outside the project source tree.')
  process.exit(1)
}

const runtime = process.env.OMGITHUB_PLAYWRIGHT_ROOT || '/home/runner/.local/share/omgithub-playwright'
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')

const views = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
]

let browser
let exitCode = 0
try {
  await timed('mkdir', () => mkdir(outputDir, { recursive: true }))

  browser = await timed('browser launch', () =>
    chromium.launch({
      headless: true,
      executablePath: process.env.CAPTURE_BROWSER || chromium.executablePath(),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader']
    })
  ).catch(error => { throw temporary(`Browser launch failed: ${error.message}`) })

  for (const view of views) {
    const label = view.name
    const pagePath = join(outputDir, `final-${label}.png`)
    const issues = []
    let context
    let page

    try {
      context = await timed(`${label} context`, () =>
        browser.newContext({
          viewport: { width: view.width, height: view.height },
          deviceScaleFactor: 1,
          hasTouch: view.isMobile,
          isMobile: view.isMobile
        })
      ).catch(error => { throw temporary(`Could not create ${label} context: ${error.message}`) })

      page = await timed(`${label} page`, () => context.newPage())
        .catch(error => { throw temporary(`Could not create ${label} page: ${error.message}`) })

      page.setDefaultTimeout(20000)
      page.on('pageerror', error => issues.push(`pageerror: ${error.message}`))
      page.on('requestfailed', request => {
        if (new URL(request.url()).origin === new URL(url).origin) {
          issues.push(`request failed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`)
        }
      })
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).origin === new URL(url).origin) {
          issues.push(`HTTP ${response.status()}: ${response.url()}`)
        }
      })

      let response
      try {
        response = await timed(`${label} navigation`, () =>
          page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
        )
      } catch (error) {
        throw temporary(`Navigation failed for ${url}: ${error.message}`)
      }
      if (!response) throw temporary(`No navigation response from ${url}`)
      if (!response.ok()) {
        const status = response.status()
        const temporaryStatus = status === 408 || status === 429 || status >= 500
        throw fail(`Preview returned HTTP ${status} for ${url}`, temporaryStatus ? 75 : 1)
      }

      await timed(`${label} render`, async () => {
        await page.waitForFunction(() => {
          const canvas = document.querySelector('#game')
          return Boolean(
            canvas &&
            canvas.width > 0 &&
            canvas.height > 0 &&
            window.__clayfront &&
            window.__clayfront.state
          )
        }, null, { timeout: 15000 })
        await page.locator('#menuOverlay').waitFor({ state: 'visible', timeout: 15000 })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(900)
      }).catch(error => {
        if (error.name === 'TimeoutError') throw fail(`Page did not render: ${error.message}`)
        throw temporary(`Rendering check failed: ${error.message}`)
      })

      const started = await timed(`${label} start`, () =>
        page.evaluate(() => {
          const button = document.querySelector('#btnStart')
          if (!button) return false
          button.click()
          return true
        })
      )
      if (!started) throw fail('Start control is missing')
      await timed(`${label} gameplay`, () =>
        page.waitForFunction(() => window.__clayfront?.state?.mode === 'playing', null, { timeout: 10000 })
      ).catch(error => {
        throw fail(`Game did not enter play mode: ${error.message}`)
      })
      await page.waitForTimeout(900)

      const rendering = await page.evaluate(() => {
        const canvas = document.querySelector('#game')
        const rect = canvas.getBoundingClientRect()
        const menu = document.querySelector('#menuOverlay')
        const dock = document.querySelector('#dock')
        return {
          canvas: { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height },
          menuHidden: menu.classList.contains('hidden'),
          dockVisible: Boolean(dock && dock.getBoundingClientRect().height > 0)
        }
      })
      if (rendering.canvas.width < 100 || rendering.canvas.cssHeight < 100 || !rendering.menuHidden || !rendering.dockVisible) {
        throw fail(`Render state is incomplete: ${JSON.stringify(rendering)}`)
      }

      await timed(`${label} screenshot`, () =>
        page.screenshot({ path: pagePath, timeout: 30000 })
      ).catch(error => {
        if (error.name === 'TimeoutError' || !browser.isConnected()) {
          throw temporary(`Screenshot failed: ${error.message}`)
        }
        throw fail(`Screenshot failed: ${error.message}`)
      })

      const shot = await stat(pagePath)
      if (shot.size < 10000) throw fail(`Screenshot is unexpectedly small: ${pagePath} (${shot.size} bytes)`)
      if (issues.length) throw fail(`Page reported rendering errors: ${issues.slice(0, 5).join('; ')}`)
      console.log(`${label} captured at ${pagePath} (${shot.size} bytes)`)
    } finally {
      await page?.close().catch(() => {})
      await context?.close().catch(() => {})
    }
  }
} catch (error) {
  console.error(`[capture] ${error.stack || error.message || error}`)
  exitCode = error.exitCode === 75 ? 75 : 1
} finally {
  if (browser) {
    await timed('browser close', () => browser.close())
      .catch(error => {
        console.error(`[capture] Browser close failed: ${error.message}`)
        exitCode ||= 75
      })
  }
}

console.error(`[capture] exit ${exitCode}`)
process.exit(exitCode)
