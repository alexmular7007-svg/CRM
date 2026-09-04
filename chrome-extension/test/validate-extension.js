import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const extDir = path.resolve(__dirname, '..')

console.log('🔍 Validating Chrome Extension Playground...')

let failed = false

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message)
    failed = true
  } else {
    console.log('✅ PASS:', message)
  }
}

// 1. Validate manifest.json
const manifestPath = path.join(extDir, 'manifest.json')
assert(fs.existsSync(manifestPath), 'manifest.json exists')

const manifestContent = fs.readFileSync(manifestPath, 'utf8')
let manifest = null
try {
  manifest = JSON.parse(manifestContent)
  assert(true, 'manifest.json is valid JSON')
} catch (e) {
  assert(false, 'manifest.json JSON parse error: ' + e.message)
}

if (manifest) {
  assert(manifest.manifest_version === 3, 'Manifest version is 3')
  assert(manifest.name === 'Chrome Extension Playground', 'Manifest name is "Chrome Extension Playground"')
  assert(manifest.version === '1.0.0', 'Manifest version is set')
  assert(manifest.action && manifest.action.default_popup, 'action.default_popup defined')
  assert(manifest.background && manifest.background.service_worker, 'background.service_worker defined')
  assert(manifest.content_scripts && manifest.content_scripts.length > 0, 'content_scripts defined')
  assert(manifest.permissions.includes('storage'), 'permissions include "storage"')
  assert(manifest.permissions.includes('activeTab'), 'permissions include "activeTab"')

  // Check referenced files in manifest
  const checkFile = (relPath, desc) => {
    const fullPath = path.join(extDir, relPath)
    assert(fs.existsSync(fullPath), `${desc} exists (${relPath})`)
  }

  checkFile(manifest.action.default_popup, 'Popup HTML')
  checkFile(manifest.background.service_worker, 'Background Worker')
  checkFile(manifest.options_page, 'Options Page')
  manifest.content_scripts[0].js.forEach((js) => checkFile(js, 'Content Script JS'))
  manifest.content_scripts[0].css.forEach((css) => checkFile(css, 'Content Script CSS'))

  // Check icons
  Object.entries(manifest.icons).forEach(([size, iconPath]) => {
    checkFile(iconPath, `Icon ${size}x${size}`)
  })
}

// 2. Check source directory modules
const requiredSrcFiles = [
  'src/popup/popup.html',
  'src/popup/popup.js',
  'src/popup/popup.css',
  'src/background/background.js',
  'src/content/contentScript.js',
  'src/content/contentStyle.css',
  'src/options/options.html',
  'src/options/options.js',
  'src/options/options.css',
  'src/services/crmApi.js',
  'src/services/crmService.js',
  'src/storage/extensionStorage.js',
  'src/storage/storageService.js',
  'src/utils/logger.js',
]

requiredSrcFiles.forEach((file) => {
  const fullPath = path.join(extDir, file)
  assert(fs.existsSync(fullPath), `Source file exists: ${file}`)
})

// 3. Validate popup.html contains required elements
const popupHtmlPath = path.join(extDir, 'src/popup/popup.html')
if (fs.existsSync(popupHtmlPath)) {
  const html = fs.readFileSync(popupHtmlPath, 'utf8')
  assert(html.includes('Chrome Extension Playground'), 'popup.html contains extension name')
  assert(html.includes('ext-status-badge'), 'popup.html contains extension status badge')
  assert(html.includes('crm-conn-badge'), 'popup.html contains CRM connection badge')
  assert(html.includes('btn-check-crm'), 'popup.html contains [Check CRM Connection] button')
  assert(html.includes('btn-run-diagnostics'), 'popup.html contains [Run Diagnostics] button')
  assert(html.includes('diag-extension'), 'popup.html contains diagnostic extension badge')
  assert(html.includes('diag-serviceWorker'), 'popup.html contains diagnostic serviceWorker badge')
  assert(html.includes('diag-storage'), 'popup.html contains diagnostic storage badge')
  assert(html.includes('diag-contentScript'), 'popup.html contains diagnostic contentScript badge')
  assert(html.includes('diag-crmApi'), 'popup.html contains diagnostic crmApi badge')
}

// 4. Validate background.js message types
const backgroundJsPath = path.join(extDir, 'src/background/background.js')
if (fs.existsSync(backgroundJsPath)) {
  const bg = fs.readFileSync(backgroundJsPath, 'utf8')
  assert(bg.includes('GET_EXTENSION_STATUS'), 'background.js handles GET_EXTENSION_STATUS')
  assert(bg.includes('RUN_DIAGNOSTIC'), 'background.js handles RUN_DIAGNOSTIC')
  assert(bg.includes('GET_STORAGE_STATUS'), 'background.js handles GET_STORAGE_STATUS')
  assert(bg.includes('PING_CRM'), 'background.js handles PING_CRM')
}

// 5. Test extensionStorage module
try {
  const { extensionStorage } = await import('../src/storage/extensionStorage.js')
  assert(typeof extensionStorage.save === 'function', 'extensionStorage.save is a function')
  assert(typeof extensionStorage.get === 'function', 'extensionStorage.get is a function')
  assert(typeof extensionStorage.remove === 'function', 'extensionStorage.remove is a function')
  assert(typeof extensionStorage.clear === 'function', 'extensionStorage.clear is a function')

  // Run in-memory storage test
  await extensionStorage.save('unit_test_key', 'unit_test_val')
  const val = await extensionStorage.get('unit_test_key')
  assert(val === 'unit_test_val', 'extensionStorage save and get works')
  await extensionStorage.remove('unit_test_key')
} catch (err) {
  assert(false, 'extensionStorage module test failed: ' + err.message)
}

console.log('───────────────────────────────────────────────────────')
if (failed) {
  console.error('💥 Extension validation FAILED!')
  process.exit(1)
} else {
  console.log('🎉 Extension validation SUCCEEDED! Ready for chrome://extensions.')
  process.exit(0)
}
