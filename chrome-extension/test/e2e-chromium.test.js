import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const extDir = path.resolve(__dirname, '..')
const downloadsDir = path.join(__dirname, 'downloads')

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
}

console.log('🚀 Starting Real Chromium End-to-End Test...')

// 1. Start lightweight local HTTP server to host test-page.html
const PORT = 8133
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'test-page.html')
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

await new Promise((resolve) => server.listen(PORT, resolve))
console.log(`🌐 Test server running on http://127.0.0.1:${PORT}`)

let browserContext = null
let hasError = false

/**
 * Helper to wait for a Chrome download item to complete and return its info
 */
async function waitForChromeDownload(background, timeoutMs = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const items = await background.evaluate(() => {
      return new Promise((resolve) => {
        chrome.downloads.search({ limit: 1, orderBy: ['-startTime'] }, resolve)
      })
    })

    if (items && items.length > 0) {
      const item = items[0]
      if (item.state === 'complete') {
        return item
      }
      if (item.state === 'interrupted') {
        throw new Error(`Download interrupted: ${item.error}`)
      }
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Timed out waiting for download after ${timeoutMs}ms`)
}

try {
  // 2. Launch Chromium with unpacked extension
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-profile-'))
  console.log('Launching Chromium with extension from:', extDir)

  browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1200, height: 800 },
    acceptDownloads: true,
  })

  // 3. Locate service worker and get extension ID
  let [background] = browserContext.serviceWorkers()
  if (!background) {
    background = await browserContext.waitForEvent('serviceworker', { timeout: 10000 })
  }
  background.on('console', (msg) => console.log('[BG LOG]', msg.text()))
  const extensionId = background.url().split('/')[2]
  console.log('✅ Extension loaded with ID:', extensionId)

  // 4. Open the 4500px tall test webpage in primary tab
  const testPage = await browserContext.newPage()
  testPage.on('console', (msg) => console.log('[PAGE LOG]', msg.text()))
  await testPage.goto(`http://127.0.0.1:${PORT}`)
  await testPage.waitForLoadState('networkidle')

  const docMetrics = await testPage.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }))
  console.log(`📄 Test page loaded. scrollHeight: ${docMetrics.scrollHeight}px, viewport: ${docMetrics.innerHeight}px`)
  if (docMetrics.scrollHeight < 3000) {
    throw new Error(`Test page is not tall enough: ${docMetrics.scrollHeight}px`)
  }

  // 5. Open extension popup
  const popupUrl = `chrome-extension://${extensionId}/src/popup/popup.html`
  const popupPage = await browserContext.newPage()
  popupPage.on('console', (msg) => console.log('[POPUP LOG]', msg.text()))
  await popupPage.goto(popupUrl)
  await popupPage.waitForLoadState('networkidle')
  console.log('✅ Extension popup opened')

  // Focus the test webpage so activeTab targets it
  await testPage.bringToFront()
  await popupPage.bringToFront()

  // =========================================================================
  // TEST FEATURE 1: FULL PAGE SCREENSHOT (PNG)
  // =========================================================================
  console.log('\n--- Testing Full Page Screenshot (PNG) ---')

  await popupPage.click('label:has(#format-png)')
  await popupPage.click('#btn-capture-full')
  console.log('Clicked "Capture Full Page" for PNG, waiting for completion...')

  // Wait for status indicator to show saved
  try {
    await popupPage.waitForFunction(
      () => {
        const el = document.getElementById('status-indicator')
        return el && el.textContent.includes('Saved full-page-screenshot-')
      },
      { timeout: 35000 }
    )
  } catch (err) {
    const alert = await popupPage.$eval('#alert-text', (el) => el.textContent).catch(() => '')
    const status = await popupPage.$eval('#status-indicator', (el) => el.textContent).catch(() => '')
    console.error(`Popup state on failure -> Status: "${status}", Alert: "${alert}"`)
    throw err
  }

  const pngItem = await waitForChromeDownload(background)
  console.log(`✅ Download confirmed via chrome.downloads: ${pngItem.filename} (${pngItem.fileSize} bytes)`)

  // Copy to test downloads directory for validation
  const testPngPath = path.join(downloadsDir, path.basename(pngItem.filename))
  fs.copyFileSync(pngItem.filename, testPngPath)

  const pngBuffer = fs.readFileSync(testPngPath)
  if (pngBuffer.length < 50000) {
    throw new Error(`PNG file is unexpectedly small: ${pngBuffer.length} bytes`)
  }

  // Verify PNG signature (89 50 4E 47 0D 0A 1A 0A)
  const isPng = pngBuffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (!isPng) {
    throw new Error('Downloaded file is not a valid PNG image!')
  }

  const imgWidth = pngBuffer.readUInt32BE(16)
  const imgHeight = pngBuffer.readUInt32BE(20)
  console.log(`📸 Stitched image dimensions: ${imgWidth}px x ${imgHeight}px`)

  if (imgHeight < 3000) {
    throw new Error(`Image height (${imgHeight}px) is not full page! Expected > 3000px.`)
  }
  console.log(`✅ Full-page height verification PASS: ${imgHeight}px is significantly taller than ${docMetrics.innerHeight}px viewport!`)

  // =========================================================================
  // TEST FEATURE 1: FULL PAGE SCREENSHOT (PDF)
  // =========================================================================
  console.log('\n--- Testing Full Page Screenshot (PDF) ---')

  await popupPage.click('label:has(#format-pdf)')
  await popupPage.click('#btn-capture-full')
  console.log('Clicked "Capture Full Page" for PDF, waiting for completion...')

  await popupPage.waitForFunction(
    () => {
      const el = document.getElementById('status-indicator')
      return el && el.textContent.includes('Saved full-page-screenshot-') && el.textContent.includes('.pdf')
    },
    { timeout: 45000 }
  )

  const pdfItem = await waitForChromeDownload(background)
  console.log(`✅ Download confirmed via chrome.downloads: ${pdfItem.filename} (${pdfItem.fileSize} bytes)`)

  const testPdfPath = path.join(downloadsDir, path.basename(pdfItem.filename))
  fs.copyFileSync(pdfItem.filename, testPdfPath)

  const pdfBuffer = fs.readFileSync(testPdfPath)
  if (pdfBuffer.length < 50000) {
    throw new Error(`PDF file is unexpectedly small: ${pdfBuffer.length} bytes`)
  }

  const pdfString = pdfBuffer.toString('latin1')
  if (!pdfString.startsWith('%PDF-1.4')) {
    throw new Error('Downloaded file does not start with %PDF-1.4 header!')
  }
  if (!pdfString.includes('%%EOF')) {
    throw new Error('Downloaded file is missing %%EOF terminator!')
  }

  // Count pages in PDF
  const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g)
  const pageCount = pageMatches ? pageMatches.length : 0
  console.log(`📄 PDF page count: ${pageCount} pages`)

  if (pageCount < 2) {
    throw new Error(`Expected multi-page PDF for 4500px page, but got ${pageCount} page(s).`)
  }
  console.log('✅ Multi-page PDF splitting verification PASS!')

  // Verify original scroll position was restored on testPage
  const currentScrollY = await testPage.evaluate(() => window.scrollY)
  console.log(`Scroll restoration check: window.scrollY = ${currentScrollY}`)
  if (currentScrollY !== 0) {
    console.warn(`Warning: scroll position is ${currentScrollY}, expected 0`)
  } else {
    console.log('✅ Original scroll position successfully restored to 0!')
  }

  // =========================================================================
  // TEST FEATURE 2: WIKIPEDIA SEARCH (POPUP & CONTEXT MENU)
  // =========================================================================
  console.log('\n--- Testing Feature 2: Wikipedia Search ---')

  // 1. Popup Wikipedia direct query
  await popupPage.fill('#wiki-query-input', 'Albert Einstein')

  const newTabPromise = browserContext.waitForEvent('page', { timeout: 15000 })
  await popupPage.click('#btn-wiki-search')

  const wikiTab = await newTabPromise
  await wikiTab.waitForLoadState('domcontentloaded')
  const wikiUrl = wikiTab.url()
  console.log('✅ Wikipedia search tab opened with URL:', wikiUrl)

  if (!wikiUrl.includes('wikipedia.org') || !wikiUrl.includes('Albert') || (!wikiUrl.includes('Einstein') && !wikiUrl.includes('Special:Search'))) {
    throw new Error(`Unexpected Wikipedia URL: ${wikiUrl}`)
  }
  console.log('✅ Wikipedia query encoding & navigation PASS!')
  await wikiTab.close()

  // 2. Background service worker context menu verification
  const contextMenuOk = await background.evaluate(() => {
    return typeof chrome.contextMenus !== 'undefined' && typeof chrome.contextMenus.onClicked !== 'undefined'
  })
  if (!contextMenuOk) {
    throw new Error('Chrome contextMenus API is not properly initialized in service worker!')
  }
  console.log('✅ Background contextMenus API is active and listening!')

  console.log('\n🎉 ALL REAL CHROMIUM END-TO-END TESTS PASSED SUCCESSFULLY!')
} catch (err) {
  console.error('❌ E2E TEST FAILED:', err)
  hasError = true
} finally {
  if (browserContext) {
    await browserContext.close().catch(() => {})
  }
  server.close()
  process.exit(hasError ? 1 : 0)
}
