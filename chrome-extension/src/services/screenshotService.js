/**
 * TaskFlow Learning Extension - Screenshot Service
 * Manifest V3 Full Page Screenshot capture, canvas stitching, and PNG/PDF export engine.
 */

import { createPdfFromCanvas, pdfBinaryToDataUrl } from '../../lib/pdf/simplePdfWriter.js'

/**
 * Format timestamp for unique screenshot filenames
 */
export function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}`
}

/**
 * Check if the active tab allows script injection and screenshot capture
 */
export function validateTabUrl(url) {
  if (!url) {
    throw new Error('Unable to inspect page URL.')
  }

  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'devtools://',
    'edge://',
    'about:',
    'view-source:',
    'https://chromewebstore.google.com',
    'https://chrome.google.com/webstore',
  ]

  for (const prefix of restrictedPrefixes) {
    if (url.startsWith(prefix)) {
      throw new Error('Chrome does not allow screenshots of this page.')
    }
  }

  return true
}

/**
 * Injected fallback function to measure full webpage dimensions
 */
function getDocumentMetrics() {
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

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const originalScrollX = window.scrollX || window.pageXOffset || 0
  const originalScrollY = window.scrollY || window.pageYOffset || 0
  const dpr = window.devicePixelRatio || 1

  return {
    url: window.location.href,
    totalWidth,
    totalHeight,
    viewportWidth,
    viewportHeight,
    originalScrollX,
    originalScrollY,
    dpr,
  }
}

/**
 * Injected fallback function to scroll window
 */
function scrollPageTo(targetY, hideFixed) {
  window.scrollTo(0, targetY)

  if (hideFixed) {
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
}

/**
 * Injected fallback function to restore original scroll position and element visibility
 */
function restorePageState(origX, origY) {
  window.scrollTo(origX, origY)
  if (window.__tfFixedElements) {
    window.__tfFixedElements.forEach((item) => {
      item.el.style.visibility = item.origVisibility
    })
    delete window.__tfFixedElements
  }
}

/**
 * Request page metrics from content script (or scripting fallback)
 */
async function requestMetrics(tab) {
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_METRICS' })
    if (res && res.totalHeight) {
      return res
    }
  } catch (err) {
    // Content script might be initializing or scripting required
  }

  if (chrome.scripting && chrome.scripting.executeScript) {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getDocumentMetrics,
    })
    if (results && results[0] && results[0].result) {
      return results[0].result
    }
  }

  throw new Error('Unable to inspect page metrics.')
}

/**
 * Request page scroll from content script (or scripting fallback)
 */
async function requestScroll(tab, targetY, hideFixed) {
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'SCROLL_PAGE',
      targetY,
      hideFixed,
    })
    return
  } catch {}

  if (chrome.scripting && chrome.scripting.executeScript) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrollPageTo,
      args: [targetY, hideFixed],
    })
  }
}

/**
 * Request scroll restoration from content script (or scripting fallback)
 */
async function requestRestore(tab, origX, origY) {
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'RESTORE_PAGE',
      origX,
      origY,
    })
    return
  } catch {}

  if (chrome.scripting && chrome.scripting.executeScript) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: restorePageState,
      args: [origX, origY],
    })
  }
}

/**
 * Safely captures the visible tab, honoring Chrome's MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota.
 */
async function captureVisibleTabWithRetry(windowId, format = 'png', maxRetries = 4) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chrome.tabs.captureVisibleTab(windowId, { format })
    } catch (err) {
      const isRateLimit = err?.message && err.message.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND')
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 800
        console.warn(`[Screenshot Service] Rate limit encountered, pausing for ${delay}ms before retry ${attempt + 1}...`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  return await chrome.tabs.captureVisibleTab(windowId, { format })
}

/**
 * Load image data URL into HTMLImageElement or ImageBitmap
 */
async function loadImage(dataUrl) {
  if (typeof Image !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error('Failed to load image slice: ' + e))
      img.src = dataUrl
    })
  }

  // Service worker fallback
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return await createImageBitmap(blob)
}

/**
 * Main Screenshot Orchestrator: Capture Full Page
 */
export async function captureFullPage(tab, format = 'png', onProgress = () => {}) {
  // Validate tab URL
  if (tab.url) {
    validateTabUrl(tab.url)
  }

  onProgress({ phase: 'init', message: 'Measuring page dimensions...' })

  // 1. Gather page dimensions
  const metrics = await requestMetrics(tab)
  if (metrics.url) {
    validateTabUrl(metrics.url)
  }

  const { totalHeight, viewportHeight, viewportWidth, originalScrollX, originalScrollY } = metrics
  const totalSteps = Math.ceil(totalHeight / viewportHeight)
  const slices = []

  try {
    for (let step = 0; step < totalSteps; step++) {
      const isFirstSlice = step === 0
      const targetY = Math.min(step * viewportHeight, Math.max(0, totalHeight - viewportHeight))

      onProgress({
        phase: 'capturing',
        current: step + 1,
        total: totalSteps,
        message: `Capturing section ${step + 1} of ${totalSteps}...`,
      })

      // Scroll to position
      await requestScroll(tab, targetY, !isFirstSlice)

      // Pause to allow scroll rendering, lazy loading, and honor Chrome's 2 calls/sec capture quota
      await new Promise((r) => setTimeout(r, 600))

      // Capture visible slice with automatic retry
      const sliceDataUrl = await captureVisibleTabWithRetry(tab.windowId, 'png')
      slices.push({
        step,
        targetY,
        dataUrl: sliceDataUrl,
      })
    }
  } finally {
    // Always restore original scroll position and sticky header styles
    try {
      await requestRestore(tab, originalScrollX, originalScrollY)
    } catch (err) {
      console.warn('Error restoring page state:', err)
    }
  }

  onProgress({ phase: 'combining', message: 'Combining screenshot sections...' })

  // 2. Stitch slices onto master canvas
  const loadedSlices = await Promise.all(
    slices.map(async (s) => ({
      ...s,
      img: await loadImage(s.dataUrl),
    }))
  )

  // Use natural slice dimensions to accurately account for devicePixelRatio / zoom
  const slicePixelWidth = loadedSlices[0].img.width
  const scale = slicePixelWidth / viewportWidth

  const fullPixelWidth = slicePixelWidth
  const fullPixelHeight = Math.round(totalHeight * scale)

  let masterCanvas
  if (typeof document !== 'undefined' && document.createElement) {
    masterCanvas = document.createElement('canvas')
    masterCanvas.width = fullPixelWidth
    masterCanvas.height = fullPixelHeight
  } else if (typeof OffscreenCanvas !== 'undefined') {
    masterCanvas = new OffscreenCanvas(fullPixelWidth, fullPixelHeight)
  } else {
    throw new Error('Canvas rendering context not available in this environment.')
  }

  const ctx = masterCanvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, fullPixelWidth, fullPixelHeight)

  for (const s of loadedSlices) {
    const drawY = Math.round(s.targetY * scale)
    ctx.drawImage(s.img, 0, drawY)
  }

  // 3. Export as PNG or PDF
  const timestamp = formatTimestamp()
  let downloadDataUrl = ''
  let filename = ''

  if (format.toLowerCase() === 'pdf') {
    onProgress({ phase: 'pdf', message: 'Generating PDF...' })
    const pdfBytes = await createPdfFromCanvas(masterCanvas)
    downloadDataUrl = pdfBinaryToDataUrl(pdfBytes)
    filename = `full-page-screenshot-${timestamp}.pdf`
  } else {
    onProgress({ phase: 'png', message: 'Encoding PNG...' })
    if (masterCanvas.toDataURL) {
      downloadDataUrl = masterCanvas.toDataURL('image/png')
    } else if (masterCanvas.convertToBlob) {
      const blob = await masterCanvas.convertToBlob({ type: 'image/png' })
      downloadDataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    }
    filename = `full-page-screenshot-${timestamp}.png`
  }

  // 4. Trigger download using Chrome downloads API
  onProgress({ phase: 'downloading', message: 'Downloading...' })

  const downloadId = await new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: downloadDataUrl,
        filename,
        saveAs: false,
      },
      (id) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message))
        }
        resolve(id)
      }
    )
  })

  onProgress({ phase: 'completed', message: 'Completed.' })

  return {
    success: true,
    filename,
    downloadId,
    totalHeight: fullPixelHeight,
    totalWidth: fullPixelWidth,
    format,
  }
}

/**
 * Capture Visible Area only
 */
export async function captureVisibleArea(tab, format = 'png', onProgress = () => {}) {
  if (tab.url) {
    validateTabUrl(tab.url)
  }

  onProgress({ phase: 'capturing', message: 'Capturing visible area...' })
  const dataUrl = await captureVisibleTabWithRetry(tab.windowId, 'png')

  const timestamp = formatTimestamp()
  let downloadUrl = dataUrl
  let filename = `visible-screenshot-${timestamp}.png`

  if (format.toLowerCase() === 'pdf') {
    onProgress({ phase: 'pdf', message: 'Generating PDF...' })
    const img = await loadImage(dataUrl)
    let canvas
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas')
    } else {
      canvas = new OffscreenCanvas(img.width, img.height)
    }
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const pdfBytes = await createPdfFromCanvas(canvas)
    downloadUrl = pdfBinaryToDataUrl(pdfBytes)
    filename = `visible-screenshot-${timestamp}.pdf`
  }

  onProgress({ phase: 'downloading', message: 'Downloading...' })

  const downloadId = await new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: downloadUrl,
        filename,
        saveAs: false,
      },
      (id) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message))
        }
        resolve(id)
      }
    )
  })

  onProgress({ phase: 'completed', message: 'Completed.' })

  return {
    success: true,
    filename,
    downloadId,
    format,
  }
}
