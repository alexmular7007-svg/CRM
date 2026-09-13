/**
 * TaskFlow Learning Extensions - Popup Controller
 * Manages Full Page Screenshot capture, Visible Area capture, and Wikipedia Search.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const alertBanner = document.getElementById('alert-banner')
  const alertText = document.getElementById('alert-text')

  const formatPng = document.getElementById('format-png')
  const formatPdf = document.getElementById('format-pdf')
  const btnCaptureFull = document.getElementById('btn-capture-full')
  const btnCaptureVisible = document.getElementById('btn-capture-visible')

  const formWikipedia = document.getElementById('form-wikipedia')
  const wikiQueryInput = document.getElementById('wiki-query-input')
  const btnWikiSearch = document.getElementById('btn-wiki-search')

  const statusIndicator = document.getElementById('status-indicator')
  const progressBarWrap = document.getElementById('progress-bar-wrap')
  const progressBarFill = document.getElementById('progress-bar-fill')

  let isCapturing = false

  // Helper: Get selected format ('png' or 'pdf')
  function getSelectedFormat() {
    return formatPdf.checked ? 'pdf' : 'png'
  }

  // Helper: Show error alert
  function showError(msg) {
    alertText.textContent = msg
    alertBanner.classList.remove('hidden')
    statusIndicator.textContent = 'Error'
    statusIndicator.className = 'status-value error'
    progressBarWrap.classList.add('hidden')
  }

  // Helper: Clear error alert
  function clearError() {
    alertBanner.classList.add('hidden')
    alertText.textContent = ''
  }

  // Helper: Update status indicator & progress bar
  function setStatus(text, current = 0, total = 0, isComplete = false) {
    statusIndicator.textContent = text
    statusIndicator.className = `status-value ${isComplete ? 'success' : ''}`

    if (total > 0 && current > 0) {
      progressBarWrap.classList.remove('hidden')
      const percent = Math.min(100, Math.round((current / total) * 100))
      progressBarFill.style.width = `${percent}%`
    } else if (isComplete) {
      progressBarWrap.classList.remove('hidden')
      progressBarFill.style.width = '100%'
      setTimeout(() => {
        progressBarWrap.classList.add('hidden')
      }, 2500)
    } else {
      progressBarWrap.classList.add('hidden')
    }
  }

  // Helper: Toggle button disabled states during operations
  function setButtonsDisabled(disabled) {
    isCapturing = disabled
    btnCaptureFull.disabled = disabled
    btnCaptureVisible.disabled = disabled
    formatPng.disabled = disabled
    formatPdf.disabled = disabled
  }

  // --- Listen to Background Progress Broadcasts ---
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SCREENSHOT_PROGRESS') {
      setStatus(msg.message || 'Processing...', msg.current, msg.total)
    }
  })

  // Helper: Find target webpage tab
  async function getTargetTabId() {
    try {
      const tabs = await chrome.tabs.query({})
      // Prioritize active http/https tab
      const activeWeb = tabs.find((t) => t.active && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
      if (activeWeb) return activeWeb.id

      // Any http/https tab
      const anyWeb = tabs.find((t) => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
      if (anyWeb) return anyWeb.id

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      return tab?.id || null
    } catch {
      return null
    }
  }

  // ============================================================================
  // FEATURE 1: FULL PAGE SCREENSHOT
  // ============================================================================

  btnCaptureFull.addEventListener('click', async () => {
    if (isCapturing) return
    clearError()
    setButtonsDisabled(true)
    const format = getSelectedFormat()
    const tabId = await getTargetTabId()
    setStatus('Preparing capture...', 0, 0)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_FULL_PAGE',
        format,
        tabId,
      })

      if (response && response.success) {
        setStatus(`Saved ${response.filename}`, 0, 0, true)
      } else {
        showError(response?.error || 'Unable to capture this page.')
      }
    } catch (err) {
      showError(err.message || 'Unable to capture this page.')
    } finally {
      setButtonsDisabled(false)
    }
  })

  // Visible Area Screenshot
  btnCaptureVisible.addEventListener('click', async () => {
    if (isCapturing) return
    clearError()
    setButtonsDisabled(true)
    const format = getSelectedFormat()
    const tabId = await getTargetTabId()
    setStatus('Capturing visible area...', 0, 0)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_VISIBLE_AREA',
        format,
        tabId,
      })

      if (response && response.success) {
        setStatus(`Saved ${response.filename}`, 0, 0, true)
      } else {
        showError(response?.error || 'Unable to capture this page.')
      }
    } catch (err) {
      showError(err.message || 'Unable to capture visible area.')
    } finally {
      setButtonsDisabled(false)
    }
  })

  // ============================================================================
  // FEATURE 2: WIKIPEDIA SEARCH (POPUP DIRECT SEARCH)
  // ============================================================================

  formWikipedia.addEventListener('submit', async (e) => {
    e.preventDefault()
    clearError()

    const query = (wikiQueryInput.value || '').trim()
    if (!query) {
      showError('Please enter a search term.')
      wikiQueryInput.focus()
      return
    }

    btnWikiSearch.disabled = true
    setStatus('Opening Wikipedia...', 0, 0)

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SEARCH_WIKIPEDIA',
        query,
      })

      if (res && res.success) {
        setStatus('Wikipedia search opened.', 0, 0, true)
        wikiQueryInput.value = ''
      } else {
        showError(res?.error || 'Failed to open Wikipedia search.')
      }
    } catch (err) {
      showError(err.message || 'Error opening Wikipedia search.')
    } finally {
      btnWikiSearch.disabled = false
    }
  })
})

/* ============================================================================
 * [TEMPORARILY DISABLED FOR LEARNING PHASE: TASKFLOW CRM CONTROLLER]
 * The original TaskFlow CRM popup controller code is preserved in `src/popup/popup.crm.js`.
 * All CRM functions (initSession, loadTasks, loadProjects, loadMembers, createTask,
 * updateTaskStatus, deleteTask, loadRecentActivities) remain 100% recoverable.
 * ============================================================================ */
