import { extensionStorage } from '../storage/extensionStorage.js'

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const extVersionEl = document.getElementById('ext-version')
  const extStatusBadge = document.getElementById('ext-status-badge')
  const crmConnBadge = document.getElementById('crm-conn-badge')
  const targetEndpointEl = document.getElementById('target-endpoint')
  const targetWorkspaceEl = document.getElementById('target-workspace')
  const consoleOutputEl = document.getElementById('console-output')
  const diagSummaryBadge = document.getElementById('diag-summary-badge')

  // Diagnostic items
  const diagElements = {
    extension: document.getElementById('diag-extension'),
    serviceWorker: document.getElementById('diag-serviceWorker'),
    storage: document.getElementById('diag-storage'),
    contentScript: document.getElementById('diag-contentScript'),
    crmApi: document.getElementById('diag-crmApi'),
  }

  // Buttons
  const btnCheckCrm = document.getElementById('btn-check-crm')
  const btnRunDiagnostics = document.getElementById('btn-run-diagnostics')
  const btnClearConsole = document.getElementById('btn-clear-console')
  const btnOpenOptions = document.getElementById('btn-open-options')

  // 1. Initialize Extension Info & Storage Settings
  try {
    const statusRes = await chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATUS' })
    if (statusRes && statusRes.success && statusRes.data) {
      extVersionEl.textContent = 'v' + statusRes.data.version
      setExtensionStatus('READY')
    } else {
      setExtensionStatus('ERROR')
    }
  } catch {
    // Fallback if background worker takes a moment
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
      extVersionEl.textContent = 'v' + chrome.runtime.getManifest().version
      setExtensionStatus('READY')
    } else {
      setExtensionStatus('READY')
    }
  }

  const settings = await extensionStorage.get()
  targetEndpointEl.textContent = (settings.crmEndpoint || 'http://localhost:8080').replace(/^https?:\/\//, '')
  targetWorkspaceEl.textContent = `#${settings.workspaceId || 1}`

  // Quick initial silent check of CRM connection
  checkCrm(false)

  // 2. Action: [Check CRM Connection]
  btnCheckCrm.addEventListener('click', () => checkCrm(true))

  async function checkCrm(verbose = true) {
    if (verbose) log('Checking CRM backend connection (/actuator/health)...', 'info')
    setCrmStatus('CHECKING')

    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING_CRM' })
      if (response && response.success) {
        setCrmStatus('CONNECTED')
        updateDiagBadge('crmApi', 'PASS')
        if (verbose) {
          log(`CRM Connected: HTTP ${response.data.statusCode} OK (${response.data.latencyMs}ms)`, 'success')
        }
      } else {
        setCrmStatus('DISCONNECTED')
        updateDiagBadge('crmApi', 'FAIL')
        if (verbose) {
          log(`CRM Disconnected: ${response?.error || 'Connection failed'} (${response?.data?.latencyMs || 0}ms)`, 'error')
        }
      }
    } catch (err) {
      setCrmStatus('DISCONNECTED')
      updateDiagBadge('crmApi', 'FAIL')
      if (verbose) {
        log(`CRM Ping Error: ${err.message}`, 'error')
      }
    }
  }

  // 3. Action: [Run Diagnostics]
  btnRunDiagnostics.addEventListener('click', async () => {
    log('Running comprehensive 5-part diagnostic suite...', 'info')
    diagSummaryBadge.textContent = 'RUNNING'
    diagSummaryBadge.className = 'diag-summary-tag'

    // Reset badges to pending
    Object.keys(diagElements).forEach((key) => updateDiagBadge(key, 'PENDING'))

    try {
      const response = await chrome.runtime.sendMessage({ type: 'RUN_DIAGNOSTIC' })
      if (response && response.success && response.data) {
        const results = response.data

        // Update all 5 badges: extension, serviceWorker, storage, contentScript, crmApi
        updateDiagBadge('extension', results.extension)
        updateDiagBadge('serviceWorker', results.serviceWorker)
        updateDiagBadge('storage', results.storage)
        updateDiagBadge('contentScript', results.contentScript)
        updateDiagBadge('crmApi', results.crmApi)

        // Update CRM status pill
        setCrmStatus(results.crmApi === 'PASS' ? 'CONNECTED' : 'DISCONNECTED')

        // Evaluate overall summary
        const allPass = Object.values(results).every((r) => r === 'PASS')
        if (allPass) {
          diagSummaryBadge.textContent = 'ALL PASS'
          diagSummaryBadge.className = 'diag-summary-tag pass'
          log('All 5 diagnostic tests PASSED!', 'success')
        } else {
          diagSummaryBadge.textContent = 'PARTIAL'
          diagSummaryBadge.className = 'diag-summary-tag fail'
          log(`Diagnostic completed: ${JSON.stringify(results)}`, 'warn')
        }

        // Detailed console logging
        if (response.details) {
          if (response.details.contentScript?.url) {
            log(`Content Script verified on: ${response.details.contentScript.url}`, 'info')
          }
          if (response.details.crmApi) {
            log(`CRM Status: ${response.details.crmApi.status} (${response.details.crmApi.latencyMs || 0}ms)`, 'info')
          }
        }
      } else {
        diagSummaryBadge.textContent = 'ERROR'
        diagSummaryBadge.className = 'diag-summary-tag fail'
        log(`Diagnostic execution error: ${response?.error || 'Unknown error'}`, 'error')
      }
    } catch (err) {
      diagSummaryBadge.textContent = 'ERROR'
      diagSummaryBadge.className = 'diag-summary-tag fail'
      log(`Diagnostic communication error: ${err.message}`, 'error')
    }
  })

  // 4. Clear Console Button
  btnClearConsole.addEventListener('click', () => {
    consoleOutputEl.innerHTML = ''
    log('Console log cleared.', 'info')
  })

  // 5. Open Options Page Button
  btnOpenOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL('src/options/options.html'))
    }
  })

  // Helper: Update Extension Status
  function setExtensionStatus(status) {
    extStatusBadge.textContent = status
    extStatusBadge.className = `status-pill ${status.toLowerCase()}`
  }

  // Helper: Update CRM Connection Pill
  function setCrmStatus(status) {
    crmConnBadge.textContent = status
    crmConnBadge.className = `status-pill ${status.toLowerCase()}`
  }

  // Helper: Update individual Diagnostic Badge
  function updateDiagBadge(key, status) {
    const el = diagElements[key]
    if (!el) return

    if (status === 'PASS') {
      el.textContent = 'PASS'
      el.className = 'diag-badge pass'
    } else if (status === 'FAIL') {
      el.textContent = 'FAIL'
      el.className = 'diag-badge fail'
    } else {
      el.textContent = '—'
      el.className = 'diag-badge pending'
    }
  }

  // Helper: Append line to log console
  function log(text, level = 'info') {
    const time = new Date().toISOString().substring(11, 19)
    const line = document.createElement('div')
    line.className = `log-line ${level}`
    line.textContent = `[${time}] ${text}`
    consoleOutputEl.appendChild(line)
    consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight
  }
})
