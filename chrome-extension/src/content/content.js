/**
 * TaskFlow Learning Extension - Content Script
 * Runs within webpage context to safely measure dimensions, execute scrolling,
 * temporarily handle fixed/sticky headers, and restore original page state.
 */

console.log('[TaskFlow Extension] Content script active on:', window.location.origin)

// Listen for messages from popup or background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Measure Document Metrics
  if (request.action === 'GET_PAGE_METRICS') {
    const doc = document.documentElement
    const body = document.body

    const totalWidth = Math.max(
      doc.scrollWidth,
      doc.offsetWidth,
      doc.clientWidth,
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0,
      window.innerWidth
    )

    const totalHeight = Math.max(
      doc.scrollHeight,
      doc.offsetHeight,
      doc.clientHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      window.innerHeight
    )

    sendResponse({
      url: window.location.href,
      totalWidth,
      totalHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      originalScrollX: window.scrollX || window.pageXOffset || 0,
      originalScrollY: window.scrollY || window.pageYOffset || 0,
      dpr: window.devicePixelRatio || 1,
    })
    return true
  }

  // 2. Scroll Page to Target Offset & Temporarily Hide Fixed Elements
  if (request.action === 'SCROLL_PAGE') {
    window.scrollTo(0, request.targetY)

    if (request.hideFixed) {
      if (!window.__tfFixedElements) {
        window.__tfFixedElements = []
        const allElements = document.querySelectorAll('*')
        for (const el of allElements) {
          const style = window.getComputedStyle(el)
          if (style.position === 'fixed' || style.position === 'sticky') {
            window.__tfFixedElements.push({
              el,
              origVisibility: el.style.visibility || '',
            })
          }
        }
      }
      window.__tfFixedElements.forEach((item) => {
        item.el.style.visibility = 'hidden'
      })
    } else if (window.__tfFixedElements) {
      window.__tfFixedElements.forEach((item) => {
        item.el.style.visibility = item.origVisibility
      })
    }

    sendResponse({ scrolled: true, currentY: window.scrollY })
    return true
  }

  // 3. Restore Original Page State & Elements
  if (request.action === 'RESTORE_PAGE') {
    window.scrollTo(request.origX || 0, request.origY || 0)

    if (window.__tfFixedElements) {
      window.__tfFixedElements.forEach((item) => {
        item.el.style.visibility = item.origVisibility
      })
      delete window.__tfFixedElements
    }

    sendResponse({ restored: true, scrollY: window.scrollY })
    return true
  }

  // 4. Retrieve Selected Text
  if (request.action === 'GET_SELECTION') {
    const selection = window.getSelection() ? window.getSelection().toString() : ''
    sendResponse({ selection })
    return true
  }
})
