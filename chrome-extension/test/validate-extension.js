import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const extDir = path.resolve(__dirname, '..')

console.log('🔍 Validating Clean TaskFlow CRM Chrome Extension...')

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
// PHASE 1: MANIFEST V3 & HELLO WORLD VALIDATION
// =========================================================================
console.log('\n--- PHASE 1: Manifest V3 & Hello World ---')

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
  assert(manifest.name.includes('TaskFlow CRM'), 'Manifest name contains "TaskFlow CRM"')
  assert(manifest.version === '1.0.0', 'Manifest version is 1.0.0')
  assert(manifest.action && manifest.action.default_popup === 'src/popup/popup.html', 'action.default_popup is src/popup/popup.html')
  assert(manifest.background && manifest.background.service_worker === 'src/background/background.js', 'background.service_worker is src/background/background.js')
  assert(manifest.content_scripts && manifest.content_scripts[0].js.includes('src/content/content.js'), 'content_scripts includes src/content/content.js')
  assert(manifest.permissions.includes('storage'), 'permissions include "storage"')
  assert(manifest.permissions.includes('activeTab'), 'permissions include "activeTab"')

  // Check referenced files
  const checkFile = (relPath, desc) => {
    const fullPath = path.join(extDir, relPath)
    assert(fs.existsSync(fullPath), `${desc} exists (${relPath})`)
  }

  checkFile(manifest.action.default_popup, 'Popup HTML')
  checkFile(manifest.background.service_worker, 'Background Worker')
  checkFile(manifest.content_scripts[0].js[0], 'Content Script')
  Object.entries(manifest.icons).forEach(([size, iconPath]) => {
    checkFile(iconPath, `Icon ${size}x${size}`)
  })
}

// Check source files
const requiredSrcFiles = [
  'src/popup/popup.html',
  'src/popup/popup.js',
  'src/popup/popup.css',
  'src/background/background.js',
  'src/content/content.js',
  'src/services/crmApi.js',
]

requiredSrcFiles.forEach((file) => {
  assert(fs.existsSync(path.join(extDir, file)), `Source file exists: ${file}`)
})

// Phase 1: Popup Hello World Elements
const popupHtmlPath = path.join(extDir, 'src/popup/popup.html')
if (fs.existsSync(popupHtmlPath)) {
  const html = fs.readFileSync(popupHtmlPath, 'utf8')
  assert(html.includes('TaskFlow CRM'), 'popup.html contains "TaskFlow CRM"')
  assert(html.includes('Hello from TaskFlow!'), 'popup.html contains "Hello from TaskFlow!" greeting')
  assert(html.includes('hello-banner'), 'popup.html contains hello-banner')
}

// Background handles HELLO_WORLD
const backgroundJsPath = path.join(extDir, 'src/background/background.js')
if (fs.existsSync(backgroundJsPath)) {
  const bg = fs.readFileSync(backgroundJsPath, 'utf8')
  assert(bg.includes('HELLO_WORLD'), 'background.js handles HELLO_WORLD message')
  assert(bg.includes('Hello from TaskFlow!'), 'background.js returns "Hello from TaskFlow!"')
}

// =========================================================================
// PHASE 2: CRUD API DEMO VALIDATION
// =========================================================================
console.log('\n--- PHASE 2: CRUD API Demo (GET, POST, PATCH, DELETE) ---')

const crmApiPath = path.join(extDir, 'src/services/crmApi.js')
if (fs.existsSync(crmApiPath)) {
  const crmApiCode = fs.readFileSync(crmApiPath, 'utf8')
  assert(crmApiCode.includes('getTasks'), 'crmApi.js implements getTasks (GET)')
  assert(crmApiCode.includes('createTask'), 'crmApi.js implements createTask (POST)')
  assert(crmApiCode.includes('getProjects'), 'crmApi.js implements getProjects (GET)')
  assert(crmApiCode.includes('updateTaskStatus'), 'crmApi.js implements updateTaskStatus (PATCH)')
  assert(crmApiCode.includes('deleteTask'), 'crmApi.js implements deleteTask (DELETE)')
}

if (fs.existsSync(backgroundJsPath)) {
  const bg = fs.readFileSync(backgroundJsPath, 'utf8')
  assert(bg.includes('GET_TASKS'), 'background.js handles GET_TASKS message')
  assert(bg.includes('GET_PROJECTS'), 'background.js handles GET_PROJECTS message')
  assert(bg.includes('CREATE_TASK'), 'background.js handles CREATE_TASK message')
  assert(bg.includes('UPDATE_TASK_STATUS'), 'background.js handles UPDATE_TASK_STATUS message')
  assert(bg.includes('DELETE_TASK'), 'background.js handles DELETE_TASK message')
}

// Unit test crmApi storage & security
try {
  const { crmApi, getStorage, setStorage, clearStorage } = await import('../src/services/crmApi.js')
  assert(typeof crmApi.getTasks === 'function', 'crmApi.getTasks is a function')
  assert(typeof crmApi.getProjects === 'function', 'crmApi.getProjects is a function')
  assert(typeof crmApi.createTask === 'function', 'crmApi.createTask is a function')
  assert(typeof crmApi.updateTaskStatus === 'function', 'crmApi.updateTaskStatus is a function')
  assert(typeof crmApi.deleteTask === 'function', 'crmApi.deleteTask is a function')

  // Storage tests
  await clearStorage()
  const initial = await getStorage()
  assert(initial.authToken === '', 'Initial authToken is empty')
  assert(initial.authenticatedUser === null, 'Initial authenticatedUser is null')
  assert(initial.workspaceId === null, 'Initial workspaceId is null')
  assert(!Object.keys(initial).includes('password'), 'Storage does not persist password field')

  // Test setStorage
  await setStorage({ authToken: 'test_token', workspaceId: 10 })
  const updated = await getStorage()
  assert(updated.authToken === 'test_token', 'setStorage persists authToken')
  assert(updated.workspaceId === 10, 'setStorage persists workspaceId')

  await clearStorage()
  const cleared = await getStorage()
  assert(cleared.authToken === '', 'clearStorage resets authToken')
  assert(cleared.workspaceId === null, 'clearStorage resets workspaceId')
} catch (err) {
  assert(false, 'crmApi module import test failed: ' + err.message)
}

// =========================================================================
// PHASE 3: REAL CRM INTEGRATION & QUICK TASK MANAGER UX
// =========================================================================
console.log('\n--- PHASE 3: Real CRM Integration & Task Manager UX ---')

if (fs.existsSync(popupHtmlPath)) {
  const html = fs.readFileSync(popupHtmlPath, 'utf8')
  assert(html.includes('Assign New Task'), 'popup.html contains "Assign New Task" button/title')
  assert(html.includes('workspace-switcher'), 'popup.html contains workspace selector')
  assert(html.includes('recent-activity-section'), 'popup.html contains recent activity section')
  assert(html.includes('task-items'), 'popup.html contains task items list')
  assert(html.includes('new-task-project'), 'popup.html contains project dropdown (new-task-project)')
  assert(html.includes('new-task-assignee'), 'popup.html contains assignee dropdown')
}

const popupJsPath = path.join(extDir, 'src/popup/popup.js')
if (fs.existsSync(popupJsPath)) {
  const js = fs.readFileSync(popupJsPath, 'utf8')
  assert(js.includes('loadTasks'), 'popup.js defines loadTasks')
  assert(js.includes('loadMembers'), 'popup.js defines loadMembers for workspace assignment')
  assert(js.includes('loadProjects'), 'popup.js defines loadProjects for project selection')
  assert(js.includes('loadRecentActivities'), 'popup.js defines loadRecentActivities')
  assert(js.includes('btn-toggle-status'), 'popup.js implements status toggle action button')
  assert(js.includes('taskItemsContainer.innerHTML = \'\''), 'popup.js immediately clears task list on workspace switch (Isolation)')
}

const popupCssPath = path.join(extDir, 'src/popup/popup.css')
if (fs.existsSync(popupCssPath)) {
  const css = fs.readFileSync(popupCssPath, 'utf8')
  assert(css.includes('380px'), 'popup.css specifies compact 380px width')
  assert(css.includes('.btn-toggle-status'), 'popup.css styles .btn-toggle-status')
  assert(css.includes('.recent-activity-section'), 'popup.css styles .recent-activity-section')
  assert(css.includes('.task-row'), 'popup.css styles .task-row')
}

console.log('\n───────────────────────────────────────────────────────')
if (failed) {
  console.error('💥 Extension validation FAILED!')
  process.exit(1)
} else {
  console.log('🎉 Extension validation SUCCEEDED! All phases verified.')
  process.exit(0)
}
