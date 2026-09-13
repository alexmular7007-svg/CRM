/**
 * TaskFlow Learning Extension - Background Service Worker (Manifest V3)
 * Handles:
 * 1. Context Menu creation & handling for Highlighted Text -> Wikipedia Search
 * 2. Background message routing for Screenshot Capture (Full Page & Visible Area)
 * 3. Safe, temporary disabling of legacy CRM routes while preserving all code for future restoration.
 */

import { searchWikipedia } from '../services/wikipediaService.js'
import { captureFullPage, captureVisibleArea } from '../services/screenshotService.js'

// ============================================================================
// FEATURE 2: CONTEXT MENU FOR HIGHLIGHTED TEXT -> WIKIPEDIA SEARCH
// ============================================================================

/**
 * Register context menu on extension installation or update.
 * contexts: ['selection'] ensures menu only appears when user highlights text.
 */
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items first to avoid duplicate ID errors on reload
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'search-wikipedia-selection',
      title: 'Search Wikipedia for "%s"',
      contexts: ['selection'],
    })
    console.log('[TaskFlow Learning] Context menu "Search Wikipedia for \\"%s\\"" registered.')
  })
})

/**
 * Handle context menu item clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'search-wikipedia-selection' && info.selectionText) {
    console.log('[TaskFlow Learning] Context menu clicked with selection:', info.selectionText)
    await searchWikipedia(info.selectionText)
  }
})

// ============================================================================
// RUNTIME MESSAGE ROUTING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((err) => {
      console.error('[TaskFlow Background] Error handling message:', message?.type, err)
      sendResponse({ success: false, error: err.message || 'Internal error' })
    })
  return true // Indicates asynchronous sendResponse
})

async function handleMessage(message, sender) {
  if (!message || !message.type) {
    return { success: false, error: 'Message type is required' }
  }

  switch (message.type) {
    // Wikipedia direct search from popup
    case 'SEARCH_WIKIPEDIA': {
      return await searchWikipedia(message.query)
    }

    // Full Page Screenshot Capture
    case 'CAPTURE_FULL_PAGE': {
      let targetTab = null
      if (message.tabId) {
        try {
          const t = await chrome.tabs.get(message.tabId)
          if (t && t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://')) {
            targetTab = t
          }
        } catch {}
      }

      if (!targetTab) {
        const allTabs = await chrome.tabs.query({})
        // Priority 1: active tab that is http/https
        targetTab = allTabs.find((t) => t.active && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
        // Priority 2: any tab that is http/https
        if (!targetTab) {
          targetTab = allTabs.find((t) => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
        }
        // Priority 3: any non-extension tab
        if (!targetTab) {
          targetTab = allTabs.find((t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
        }
      }

      if (!targetTab) {
        return { success: false, error: 'No webpage found to capture.' }
      }

      // Activate the target tab so captureVisibleTab captures it
      await chrome.tabs.update(targetTab.id, { active: true })
      await new Promise((r) => setTimeout(r, 100))

      return await captureFullPage(targetTab, message.format || 'png', (progress) => {
        // Broadcast progress updates to popup
        chrome.runtime.sendMessage({
          type: 'SCREENSHOT_PROGRESS',
          ...progress,
        }).catch(() => {})
      })
    }

    // Visible Area Screenshot Capture
    case 'CAPTURE_VISIBLE_AREA': {
      let targetTab = null
      if (message.tabId) {
        try {
          const t = await chrome.tabs.get(message.tabId)
          if (t && t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://')) {
            targetTab = t
          }
        } catch {}
      }

      if (!targetTab) {
        const allTabs = await chrome.tabs.query({})
        targetTab = allTabs.find((t) => t.active && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
        if (!targetTab) {
          targetTab = allTabs.find((t) => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
        }
        if (!targetTab) {
          targetTab = allTabs.find((t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://'))
        }
      }

      if (!targetTab) {
        return { success: false, error: 'No webpage found to capture.' }
      }

      await chrome.tabs.update(targetTab.id, { active: true })
      await new Promise((r) => setTimeout(r, 100))

      return await captureVisibleArea(targetTab, message.format || 'png', (progress) => {
        chrome.runtime.sendMessage({
          type: 'SCREENSHOT_PROGRESS',
          ...progress,
        }).catch(() => {})
      })
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}

/* ============================================================================
 * [TEMPORARILY DISABLED FOR LEARNING PHASE: TASKFLOW CRM BACKGROUND ROUTING]
 * The code below represents the working TaskFlow CRM routes from commit 388340a.
 * Preserved intact and unmodified to ensure 100% recoverability in the future.
 * ============================================================================
 *
 * import { crmApi, getStorage, setStorage, clearStorage } from '../services/crmApi.js'
 *
 * // Legacy CRM Message Types:
 * // 'LOGIN', 'LOGOUT', 'GET_AUTH', 'SET_ENDPOINT', 'SWITCH_WORKSPACE',
 * // 'GET_WORKSPACES', 'GET_MEMBERS', 'GET_PROJECTS', 'GET_TASKS',
 * // 'CREATE_TASK', 'UPDATE_TASK_STATUS', 'DELETE_TASK', 'GET_RECENT_ACTIVITY'
 * ============================================================================ */
