import { extensionStorage } from '../storage/extensionStorage.js'
import { crmApi } from '../services/crmApi.js'

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form')
  const endpointInput = document.getElementById('crmEndpoint')
  const workspaceInput = document.getElementById('workspaceId')
  const tokenInput = document.getElementById('authToken')
  const testBtn = document.getElementById('test-btn')
  const resetBtn = document.getElementById('reset-btn')
  const statusCard = document.getElementById('status-card')
  const statusIndicator = document.getElementById('status-indicator')
  const statusMessage = document.getElementById('status-message')

  // Load existing settings
  const settings = await extensionStorage.get()
  endpointInput.value = settings.crmEndpoint || 'http://localhost:8080'
  workspaceInput.value = settings.workspaceId !== null && settings.workspaceId !== undefined ? settings.workspaceId : ''
  tokenInput.value = settings.authToken || ''

  // Save Settings
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const parsedWs = workspaceInput.value.trim() ? parseInt(workspaceInput.value, 10) : null
    await extensionStorage.save({
      crmEndpoint: endpointInput.value.trim(),
      workspaceId: parsedWs,
      authToken: tokenInput.value.trim(),
    })
    showStatus('Settings saved successfully!', 'success')
  })

  // Test Connection
  testBtn.addEventListener('click', async () => {
    showStatus('Testing connection to ' + endpointInput.value + '...', 'pending')
    testBtn.disabled = true

    // Temporarily save before test
    const parsedWs = workspaceInput.value.trim() ? parseInt(workspaceInput.value, 10) : null
    await extensionStorage.save({
      crmEndpoint: endpointInput.value.trim(),
      workspaceId: parsedWs,
      authToken: tokenInput.value.trim(),
    })

    const result = await crmApi.checkConnection()
    testBtn.disabled = false

    if (result.success) {
      showStatus(`Connected! Status: 200 OK (${result.latencyMs}ms)`, 'success')
    } else {
      showStatus(`Connection failed: ${result.error} (${result.latencyMs}ms)`, 'error')
    }
  })

  // Reset to Defaults
  resetBtn.addEventListener('click', async () => {
    if (confirm('Reset all settings to defaults?')) {
      await extensionStorage.clear()
      const defaults = await extensionStorage.get()
      endpointInput.value = defaults.crmEndpoint
      workspaceInput.value = defaults.workspaceId
      tokenInput.value = defaults.authToken
      showStatus('Settings reset to defaults', 'success')
    }
  })

  function showStatus(msg, type) {
    statusCard.classList.remove('hidden')
    statusMessage.textContent = msg
    statusIndicator.className = 'dot ' + type
  }
})
