import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const extDir = path.resolve(__dirname, '..')

console.log('🔍 Validating TaskFlow Learning Extensions (Screenshot & Wikipedia)...')

let failed = false

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message)
    failed = true
  } else {
    console.log('✅ PASS:', message)
  }
}

// =========================================================================
// 1. MANIFEST V3 VALIDATION
// =========================================================================
console.log('\n--- 1. Manifest V3 & Permissions ---')

const manifestPath = path.join(extDir, 'manifest.json')
assert(fs.existsSync(manifestPath), 'manifest.json exists')

let manifest = null
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert(true, 'manifest.json is valid JSON')
} catch (e) {
  assert(false, 'manifest.json parse error: ' + e.message)
}

if (manifest) {
  assert(manifest.manifest_version === 3, 'Manifest version is 3')
  assert(manifest.name.includes('TaskFlow'), 'Manifest name contains "TaskFlow"')
  assert(manifest.action && manifest.action.default_popup === 'src/popup/popup.html', 'action.default_popup is src/popup/popup.html')
  assert(manifest.background && manifest.background.service_worker === 'src/background/background.js', 'background.service_worker is src/background/background.js')
  assert(manifest.background.type === 'module', 'background service worker type is "module"')

  // Permissions: activeTab, tabs, scripting, downloads, contextMenus
  const reqPerms = ['activeTab', 'tabs', 'scripting', 'downloads', 'contextMenus']
  reqPerms.forEach((p) => {
    assert(manifest.permissions && manifest.permissions.includes(p), `permissions includes "${p}"`)
  })

  // host_permissions: strictly for captureVisibleTab screenshot capability
  assert(manifest.host_permissions && manifest.host_permissions.includes('<all_urls>'), 'host_permissions includes "<all_urls>" for full-page screenshot capture')
}

// =========================================================================
// 2. PRESERVATION OF EXISTING TASKFLOW CRM IMPLEMENTATION
// =========================================================================
console.log('\n--- 2. Preservation of Existing CRM Files (100% Recoverable) ---')

assert(fs.existsSync(path.join(extDir, 'manifest.crm.json')), 'manifest.crm.json backup exists')
assert(fs.existsSync(path.join(extDir, 'src/services/crmApi.js')), 'src/services/crmApi.js is safely preserved')
assert(fs.existsSync(path.join(extDir, 'src/background/background.crm.js')), 'src/background/background.crm.js backup exists')
assert(fs.existsSync(path.join(extDir, 'src/popup/popup.crm.html')), 'src/popup/popup.crm.html backup exists')
assert(fs.existsSync(path.join(extDir, 'src/popup/popup.crm.js')), 'src/popup/popup.crm.js backup exists')
assert(fs.existsSync(path.join(extDir, 'src/popup/popup.crm.css')), 'src/popup/popup.crm.css backup exists')

// Verify crmApi methods remain intact
const crmApiCode = fs.readFileSync(path.join(extDir, 'src/services/crmApi.js'), 'utf8')
assert(crmApiCode.includes('getTasks'), 'crmApi.js contains getTasks')
assert(crmApiCode.includes('createTask'), 'crmApi.js contains createTask')
assert(crmApiCode.includes('getProjects'), 'crmApi.js contains getProjects')
assert(crmApiCode.includes('updateTaskStatus'), 'crmApi.js contains updateTaskStatus')

// =========================================================================
// 3. FEATURE 1: FULL PAGE SCREENSHOT VALIDATION
// =========================================================================
console.log('\n--- 3. Feature 1: Full Page Screenshot Engine ---')

const popupHtmlPath = path.join(extDir, 'src/popup/popup.html')
const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8')

assert(popupHtml.includes('btn-capture-full'), 'popup.html contains "Capture Full Page" button')
assert(popupHtml.includes('btn-capture-visible'), 'popup.html contains "Capture Visible Area" button')
assert(popupHtml.includes('format-png'), 'popup.html contains PNG format option')
assert(popupHtml.includes('format-pdf'), 'popup.html contains PDF format option')
assert(popupHtml.includes('status-indicator'), 'popup.html contains status indicator')
assert(popupHtml.includes('progress-bar-wrap'), 'popup.html contains progress bar')

const screenshotServicePath = path.join(extDir, 'src/services/screenshotService.js')
assert(fs.existsSync(screenshotServicePath), 'screenshotService.js exists')
const screenshotCode = fs.readFileSync(screenshotServicePath, 'utf8')
assert(screenshotCode.includes('captureFullPage'), 'screenshotService.js exports captureFullPage')
assert(screenshotCode.includes('captureVisibleArea'), 'screenshotService.js exports captureVisibleArea')
assert(screenshotCode.includes('validateTabUrl'), 'screenshotService.js implements validateTabUrl')
assert(screenshotCode.includes('chrome.downloads.download'), 'screenshotService.js calls chrome.downloads.download')
assert(screenshotCode.includes('Chrome does not allow screenshots of this page'), 'screenshotService.js provides clean error for restricted pages')

// Test validateTabUrl
try {
  const { validateTabUrl } = await import('../src/services/screenshotService.js')
  assert(validateTabUrl('https://example.com/long-page') === true, 'validateTabUrl allows standard https pages')
  
  let caughtChrome = false
  try {
    validateTabUrl('chrome://extensions')
  } catch (err) {
    caughtChrome = err.message.includes('Chrome does not allow screenshots')
  }
  assert(caughtChrome, 'validateTabUrl rejects chrome:// URLs with user-friendly message')
} catch (err) {
  assert(false, 'Failed to import screenshotService: ' + err.message)
}

// PDF generation engine validation
const pdfWriterPath = path.join(extDir, 'lib/pdf/simplePdfWriter.js')
assert(fs.existsSync(pdfWriterPath), 'simplePdfWriter.js exists')

try {
  const { buildPdfBinary } = await import('../lib/pdf/simplePdfWriter.js')
  // Create dummy test page
  const dummyJpeg = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 255, 219, 0, 67, 0, 255, 218, 0, 12, 3, 1, 0, 2, 17, 3, 17, 0, 63, 0, 255, 217])
  const pdfBytes = buildPdfBinary([{
    width: 100,
    height: 100,
    jpegBytes: dummyJpeg,
    mediaBoxWidth: 595.28,
    mediaBoxHeight: 841.89
  }])

  const pdfStr = Buffer.from(pdfBytes).toString('latin1')
  assert(pdfStr.startsWith('%PDF-1.4'), 'Generated PDF starts with %PDF-1.4 header')
  assert(pdfStr.includes('/Type /Catalog'), 'Generated PDF contains catalog dictionary')
  assert(pdfStr.includes('/Type /Pages'), 'Generated PDF contains pages tree')
  assert(pdfStr.includes('/Type /Page'), 'Generated PDF contains page object')
  assert(pdfStr.includes('/Filter /DCTDecode'), 'Generated PDF contains DCTDecode image stream')
  assert(pdfStr.includes('xref'), 'Generated PDF contains xref table')
  assert(pdfStr.includes('startxref'), 'Generated PDF contains startxref pointer')
  assert(pdfStr.includes('%%EOF'), 'Generated PDF terminates with %%EOF')
} catch (err) {
  assert(false, 'PDF generator test failed: ' + err.message)
}

// =========================================================================
// 4. FEATURE 2: WIKIPEDIA SEARCH VALIDATION
// =========================================================================
console.log('\n--- 4. Feature 2: Highlighted Text -> Wikipedia Search ---')

const wikiServicePath = path.join(extDir, 'src/services/wikipediaService.js')
assert(fs.existsSync(wikiServicePath), 'wikipediaService.js exists')

try {
  const { buildWikipediaSearchUrl } = await import('../src/services/wikipediaService.js')
  
  // Test trimming & encoding
  const testUrl1 = buildWikipediaSearchUrl('  Albert Einstein  ')
  assert(testUrl1 === 'https://en.wikipedia.org/wiki/Special:Search?search=Albert%20Einstein', 'buildWikipediaSearchUrl trims whitespace and encodes spaces')

  const testUrl2 = buildWikipediaSearchUrl('quantum physics & mechanics!')
  assert(testUrl2 === 'https://en.wikipedia.org/wiki/Special:Search?search=quantum%20physics%20%26%20mechanics!', 'buildWikipediaSearchUrl properly encodes & and special characters')

  const testUrl3 = buildWikipediaSearchUrl('   ')
  assert(testUrl3 === null, 'buildWikipediaSearchUrl returns null for blank whitespace query')
} catch (err) {
  assert(false, 'wikipediaService test failed: ' + err.message)
}

// Background script context menu registration
const bgPath = path.join(extDir, 'src/background/background.js')
const bgCode = fs.readFileSync(bgPath, 'utf8')

assert(bgCode.includes('chrome.contextMenus.create'), 'background.js calls chrome.contextMenus.create')
assert(bgCode.includes('contexts: [\'selection\']') || bgCode.includes("contexts: [\"selection\"]"), 'background.js registers context menu for "selection" only')
assert(bgCode.includes('chrome.contextMenus.onClicked'), 'background.js handles context menu click')
assert(bgCode.includes('CAPTURE_FULL_PAGE'), 'background.js handles CAPTURE_FULL_PAGE message')
assert(bgCode.includes('CAPTURE_VISIBLE_AREA'), 'background.js handles CAPTURE_VISIBLE_AREA message')
assert(bgCode.includes('SEARCH_WIKIPEDIA'), 'background.js handles SEARCH_WIKIPEDIA message')

// Popup UI Wikipedia elements
assert(popupHtml.includes('form-wikipedia'), 'popup.html contains Wikipedia search form')
assert(popupHtml.includes('wiki-query-input'), 'popup.html contains Wikipedia query input')
assert(popupHtml.includes('btn-wiki-search'), 'popup.html contains Wikipedia search button')

// Popup JS handlers
const popupJsPath = path.join(extDir, 'src/popup/popup.js')
const popupJs = fs.readFileSync(popupJsPath, 'utf8')
assert(popupJs.includes('btnCaptureFull'), 'popup.js handles btnCaptureFull')
assert(popupJs.includes('formWikipedia'), 'popup.js handles formWikipedia')
assert(popupJs.includes('getSelectedFormat'), 'popup.js gets selected PNG/PDF format')

console.log('\n───────────────────────────────────────────────────────')
if (failed) {
  console.error('💥 Extension validation FAILED!')
  process.exit(1)
} else {
  console.log('🎉 Extension validation SUCCEEDED! All learning features verified.')
  process.exit(0)
}
