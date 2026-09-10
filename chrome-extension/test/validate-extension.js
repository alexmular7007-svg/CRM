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

  // 6. Test Default Settings & Password Security
  await extensionStorage.clear()
  const defaults = await extensionStorage.get()
  assert(defaults.workspaceId === null, 'DEFAULT_SETTINGS workspaceId is null (not 1)')
  assert(defaults.authToken === '', 'DEFAULT_SETTINGS authToken is empty')
  assert(defaults.authenticatedUser === null, 'DEFAULT_SETTINGS authenticatedUser is null')
  assert(Array.isArray(defaults.availableWorkspaces) && defaults.availableWorkspaces.length === 0, 'DEFAULT_SETTINGS availableWorkspaces is empty')
  assert(!Object.keys(defaults).includes('password'), 'Storage schema does not store passwords')

  // 7. Test Account Isolation & Switching
  const accountA = { id: 101, fullName: 'Alex Miller', email: 'alex@example.com' }
  const tokenA = 'token_account_a'
  await extensionStorage.save({
    authToken: tokenA,
    authenticatedUser: accountA,
    availableWorkspaces: [{ id: 42, name: 'Workspace A' }],
    workspaceId: 42,
  })
  const storedA = await extensionStorage.get()
  assert(storedA.authenticatedUser.fullName === 'Alex Miller', 'Account A stored successfully')
  assert(storedA.workspaceId === 42, 'Account A workspace is 42')

  // Logout Account A
  await extensionStorage.save({
    authToken: '',
    authenticatedUser: null,
    availableWorkspaces: [],
    workspaceId: null,
    diagnosticResults: null,
  })
  const loggedOutState = await extensionStorage.get()
  assert(loggedOutState.authToken === '', 'Logout clears authToken')
  assert(loggedOutState.authenticatedUser === null, 'Logout clears authenticatedUser')
  assert(loggedOutState.workspaceId === null, 'Logout clears workspaceId')

  // Login Account B
  const accountB = { id: 202, fullName: 'Sarah Connor', email: 'sarah@example.com' }
  const tokenB = 'token_account_b'
  await extensionStorage.save({
    authToken: tokenB,
    authenticatedUser: accountB,
    availableWorkspaces: [{ id: 88, name: 'WS 1' }, { id: 99, name: 'WS 2' }],
    workspaceId: null, // multi-workspace requires selection
  })
  const storedB = await extensionStorage.get()
  assert(storedB.authenticatedUser.fullName === 'Sarah Connor', 'Account B stored successfully')
  assert(storedB.workspaceId === null, 'Account B multi-workspace is null until selected')
  assert(!JSON.stringify(storedB).includes('Alex'), 'Account B storage contains zero Account A data')

  // Reset to clean defaults
  await extensionStorage.clear()
} catch (err) {
  assert(false, 'extensionStorage module test failed: ' + err.message)
}

// 8. Validate Quick Task Manager API & Background integration
const crmApiPath = path.join(extDir, 'src/services/crmApi.js')
if (fs.existsSync(crmApiPath)) {
  const crmApiCode = fs.readFileSync(crmApiPath, 'utf8')
  assert(crmApiCode.includes('updateTaskStatus'), 'crmApi.js provides updateTaskStatus')
  assert(crmApiCode.includes('/api/tasks/'), 'crmApi.js uses /api/tasks/ endpoint')
  assert(crmApiCode.includes('PATCH'), 'crmApi.js uses PATCH method for task status updates')
}

if (fs.existsSync(backgroundJsPath)) {
  const bg = fs.readFileSync(backgroundJsPath, 'utf8')
  assert(bg.includes('UPDATE_TASK_STATUS'), 'background.js handles UPDATE_TASK_STATUS message')
}

// 9. Validate popup.js task completion & workspace isolation
const popupJsPath = path.join(extDir, 'src/popup/popup.js')
if (fs.existsSync(popupJsPath)) {
  const popupJs = fs.readFileSync(popupJsPath, 'utf8')
  assert(popupJs.includes('task-status-btn'), 'popup.js creates task status action buttons')
  assert(popupJs.includes('UPDATE_TASK_STATUS'), 'popup.js sends UPDATE_TASK_STATUS messages')
  assert(popupJs.includes('taskItemsContainer.innerHTML = \'\''), 'popup.js clears stale tasks immediately on workspace switch')
}

// 10. Validate popup.css task styling
const popupCssPath = path.join(extDir, 'src/popup/popup.css')
if (fs.existsSync(popupCssPath)) {
  const popupCss = fs.readFileSync(popupCssPath, 'utf8')
  assert(popupCss.includes('.task-status-btn'), 'popup.css styles task-status-btn')
  assert(popupCss.includes('.workspace-select'), 'popup.css styles workspace-select')
  assert(popupCss.includes('.task-status-btn.completed'), 'popup.css styles completed state')
}

console.log('───────────────────────────────────────────────────────')
if (failed) {
  console.error('💥 Extension validation FAILED!')
  process.exit(1)
} else {
  console.log('🎉 Extension validation SUCCEEDED! Ready for chrome://extensions.')
  process.exit(0)
}
