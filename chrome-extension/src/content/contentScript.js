/**
 * Content Script
 * Runs in the isolated DOM context of the web page.
 * Demonstrates page inspection and messaging with the background/popup.
 */
console.log('[CRM-Extension Content Script] Injected into:', window.location.href)

// Listen for messages from popup or background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CRM-Extension Content Script] Received message:', message)

  if (message?.type === 'PING_CONTENT_SCRIPT') {
    // Show visual indicator on the page
    showDiagnosticNotification('CRM Extension Connected to Tab')

    sendResponse({
      success: true,
      pageTitle: document.title,
      url: window.location.href,
      readyState: document.readyState,
      timestamp: new Date().toISOString(),
    })
    return true
  }

  if (message?.type === 'TOGGLE_DIAGNOSTIC_BADGE') {
    toggleFloatingBadge()
    sendResponse({ success: true, badgeVisible: !!document.getElementById('crm-ext-floating-badge') })
    return true
  }

  sendResponse({ success: false, error: 'Unknown content script action' })
  return true
})

/**
 * Display a temporary floating toast on the webpage
 */
function showDiagnosticNotification(text) {
  const existing = document.getElementById('crm-ext-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'crm-ext-toast'
  toast.className = 'crm-ext-diagnostic-toast'
  toast.innerHTML = `
    <div class="crm-ext-toast-content">
      <span class="crm-ext-toast-dot"></span>
      <span>${text}</span>
    </div>
  `
  document.body.appendChild(toast)

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(10px)'
      setTimeout(() => toast.remove(), 300)
    }
  }, 3500)
}

/**
 * Toggle a persistent diagnostic badge in bottom-right corner
 */
function toggleFloatingBadge() {
  const badgeId = 'crm-ext-floating-badge'
  const existing = document.getElementById(badgeId)
  if (existing) {
    existing.remove()
    return
  }

  const badge = document.createElement('div')
  badge.id = badgeId
  badge.className = 'crm-ext-floating-badge'
  badge.innerHTML = `
    <div class="crm-ext-badge-inner">
      <span class="crm-ext-badge-title">CRM Extension Playground</span>
      <span class="crm-ext-badge-status">Active</span>
      <button class="crm-ext-badge-close" title="Close badge">&times;</button>
    </div>
  `
  badge.querySelector('.crm-ext-badge-close').addEventListener('click', () => badge.remove())
  document.body.appendChild(badge)
}
