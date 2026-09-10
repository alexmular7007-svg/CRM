import { logger } from '../utils/logger.js'
import { extensionStorage } from '../storage/extensionStorage.js'
import { crmApi } from '../services/crmApi.js'

logger.info('Background Service Worker initialized.')

/**
 * Handle Extension Lifecycle
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info('Extension installed/updated. Reason:', details.reason)
  const currentSettings = await extensionStorage.get()
  logger.info('Current settings loaded on startup:', {
    crmEndpoint: currentSettings.crmEndpoint,
    workspaceId: currentSettings.workspaceId,
  })
})

/**
 * Standardized Message Listener
 * Handles: GET_EXTENSION_STATUS, RUN_DIAGNOSTIC, GET_STORAGE_STATUS, PING_CRM
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.info('Message received in background worker:', message?.type, 'From:', sender?.tab ? `Tab ${sender.tab.id}` : 'Popup')

  handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => {
      logger.error('Error handling message:', err)
      sendResponse({ success: false, data: null, error: err.message })
    })

  // Return true to indicate asynchronous response
  return true
})

async function handleMessage(message, sender) {
  const manifest = chrome.runtime.getManifest()

  switch (message?.type) {
    // 1. GET_EXTENSION_STATUS
    case 'GET_EXTENSION_STATUS':
      return {
        success: true,
        data: {
          name: manifest.name,
          version: manifest.version,
          manifestVersion: manifest.manifest_version,
          status: 'READY',
          timestamp: new Date().toISOString(),
        },
        error: null,
      }

    // 2. GET_STORAGE_STATUS
    case 'GET_STORAGE_STATUS': {
      try {
        const testKey = '__storage_test__'
        const testVal = Date.now()
        await extensionStorage.save(testKey, testVal)
        const retrieved = await extensionStorage.get(testKey)
        await extensionStorage.remove(testKey)
        const allSettings = await extensionStorage.get()

        return {
          success: true,
          data: {
            available: retrieved === testVal,
            settings: allSettings,
          },
          error: null,
        }
      } catch (err) {
        return {
          success: false,
          data: null,
          error: err.message,
        }
      }
    }

    // 3. PING_CRM
    case 'PING_CRM': {
      try {
        const result = await crmApi.checkConnection()
        return {
          success: result.success,
          data: result,
          error: result.error || null,
        }
      } catch (err) {
        return {
          success: false,
          data: null,
          error: err.message,
        }
      }
    }

    // 4. RUN_DIAGNOSTIC (5-part diagnostic returning PASS/FAIL)
    case 'RUN_DIAGNOSTIC': {
      const diagnostic = {
        extension: 'FAIL',
        serviceWorker: 'FAIL',
        storage: 'FAIL',
        contentScript: 'FAIL',
        crmApi: 'FAIL',
      }
      const details = {}

      // 1. Extension check
      if (manifest && manifest.manifest_version === 3) {
        diagnostic.extension = 'PASS'
        details.extension = { name: manifest.name, version: manifest.version }
      }

      // 2. Service worker check
      diagnostic.serviceWorker = 'PASS'
      details.serviceWorker = { status: 'ACTIVE', context: 'background' }

      // 3. Storage check
      try {
        const testKey = '__diag_test__'
        await extensionStorage.save(testKey, 'ok')
        const readBack = await extensionStorage.get(testKey)
        await extensionStorage.remove(testKey)
        if (readBack === 'ok') {
          diagnostic.storage = 'PASS'
          details.storage = { status: 'OPERATIONAL' }
        } else {
          details.storage = { status: 'READ_MISMATCH' }
        }
      } catch (e) {
        details.storage = { status: 'ERROR', error: e.message }
      }

      // 4. Content Script check
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs && tabs.length > 0 && tabs[0].id) {
          const tab = tabs[0]
          // chrome:// and edge:// URLs do not allow content scripts
          if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
            diagnostic.contentScript = 'PASS'
            details.contentScript = { status: 'RESTRICTED_TAB', note: 'Restricted system page; content script registered in manifest' }
          } else {
            const csResponse = await chrome.tabs.sendMessage(tab.id, { type: 'PING_CONTENT_SCRIPT' })
            if (csResponse && csResponse.success) {
              diagnostic.contentScript = 'PASS'
              details.contentScript = { status: 'CONNECTED', url: csResponse.url }
            } else {
              diagnostic.contentScript = 'FAIL'
              details.contentScript = { status: 'NO_RESPONSE', error: 'Content script did not answer' }
            }
          }
        } else {
          diagnostic.contentScript = 'PASS'
          details.contentScript = { status: 'NO_ACTIVE_TAB' }
        }
      } catch (e) {
        // If tab is not injected or user is on an unsupported URL, report status
        details.contentScript = { status: 'DISCONNECTED', error: e.message }
        diagnostic.contentScript = 'FAIL'
      }

      // 5. CRM API check
      try {
        const crmRes = await crmApi.checkConnection()
        diagnostic.crmApi = crmRes.success ? 'PASS' : 'FAIL'
        details.crmApi = {
          status: crmRes.status,
          latencyMs: crmRes.latencyMs,
          statusCode: crmRes.statusCode,
          error: crmRes.error || null,
        }
      } catch (e) {
        diagnostic.crmApi = 'FAIL'
        details.crmApi = { status: 'DISCONNECTED', error: e.message }
      }

      // Save latest diagnostic results to storage
      await extensionStorage.save('lastDiagnostic', {
        timestamp: new Date().toISOString(),
        results: diagnostic,
        details,
      })

      return {
        success: true,
        data: diagnostic,
        details,
        error: null,
      }
    }

    // Backward-compatible handlers
    case 'PING_BACKGROUND':
      return {
        success: true,
        data: {
          message: 'PONG from Service Worker',
          timestamp: new Date().toISOString(),
          version: manifest.version,
        },
        error: null,
      }

    case 'PING_CRM_HEALTH':
      return await crmApi.checkConnection()

    // Native Authentication & Workspace Actions
    case 'LOGIN': {
      try {
        const { email, password, endpoint } = message
        if (!email || !password) {
          return { success: false, error: 'Email and password are required' }
        }

        const loginRes = await crmApi.login(email, password, endpoint)
        if (!loginRes.success || !loginRes.token) {
          return { success: false, error: loginRes.error || 'Login failed' }
        }

        const token = loginRes.token
        const user = loginRes.user

        // Discover user's accessible workspaces
        const wsRes = await crmApi.fetchWorkspaces(token, endpoint)
        const workspaces = wsRes.success && Array.isArray(wsRes.data) ? wsRes.data : []

        // Workspace selection policy:
        // - exactly 1 accessible workspace -> auto-select it.
        // - more than 1 accessible workspace -> do NOT blindly default; let user select (workspaceId = null, or keep null until selected).
        // - 0 accessible workspaces -> null
        let selectedWorkspaceId = null
        if (workspaces.length === 1) {
          selectedWorkspaceId = workspaces[0].id
        }

        // Save session data to extensionStorage
        await extensionStorage.save({
          authToken: token,
          authenticatedUser: user,
          availableWorkspaces: workspaces,
          workspaceId: selectedWorkspaceId,
        })

        return {
          success: true,
          data: {
            user,
            token,
            workspaces,
            selectedWorkspaceId,
          },
        }
      } catch (err) {
        logger.error('Login action error:', err)
        return { success: false, error: err.message || 'Login failed' }
      }
    }

    case 'LOGOUT': {
      try {
        // Full session cleanup: remove token, user, workspaces, selected workspaceId, and diagnosticResults
        await extensionStorage.save({
          authToken: '',
          authenticatedUser: null,
          availableWorkspaces: [],
          workspaceId: null,
          diagnosticResults: null,
        })
        logger.info('User successfully logged out and storage cleaned.')
        return { success: true }
      } catch (err) {
        logger.error('Logout error:', err)
        return { success: false, error: err.message || 'Logout failed' }
      }
    }

    case 'VALIDATE_SESSION': {
      try {
        const settings = await extensionStorage.get()
        const token = message.token || settings.authToken

        if (!token || !token.trim()) {
          return {
            success: true,
            valid: false,
            authenticated: false,
            user: null,
          }
        }

        const valRes = await crmApi.validateSession(token, settings.crmEndpoint)
        if (valRes.valid) {
          // Token is valid; refresh workspaces if needed
          let workspaces = settings.availableWorkspaces || []
          if (!workspaces || workspaces.length === 0) {
            const wsRes = await crmApi.fetchWorkspaces(token, settings.crmEndpoint)
            if (wsRes.success && Array.isArray(wsRes.data)) {
              workspaces = wsRes.data
              await extensionStorage.save({ availableWorkspaces: workspaces })
            }
          }

          return {
            success: true,
            valid: true,
            authenticated: true,
            user: valRes.user || settings.authenticatedUser,
            workspaces,
            workspaceId: settings.workspaceId,
          }
        } else {
          // 401/403 or invalid: clear session state
          await extensionStorage.save({
            authToken: '',
            authenticatedUser: null,
            availableWorkspaces: [],
            workspaceId: null,
          })
          return {
            success: true,
            valid: false,
            authenticated: false,
            error: valRes.error || 'Session expired',
          }
        }
      } catch (err) {
        return {
          success: false,
          valid: false,
          authenticated: false,
          error: err.message,
        }
      }
    }

    case 'GET_USER_WORKSPACES': {
      try {
        const settings = await extensionStorage.get()
        const token = message.token || settings.authToken
        if (!token) {
          return { success: false, data: [], error: 'Not authenticated' }
        }
        const wsRes = await crmApi.fetchWorkspaces(token, settings.crmEndpoint)
        if (wsRes.success) {
          await extensionStorage.save({ availableWorkspaces: wsRes.data })
        }
        return wsRes
      } catch (err) {
        return { success: false, data: [], error: err.message }
      }
    }

    case 'SWITCH_WORKSPACE': {
      try {
        const newWorkspaceId = message.workspaceId ? parseInt(message.workspaceId, 10) : null
        await extensionStorage.save({ workspaceId: newWorkspaceId })
        return { success: true, workspaceId: newWorkspaceId }
      } catch (err) {
        return { success: false, error: err.message }
      }
    }

    case 'FETCH_EXTENSIONS':
      return await crmApi.fetchExtensions()

    case 'FETCH_TASKS':
    case 'GET_TASKS': {
      try {
        const wsId = message.workspaceId ?? null
        const token = message.token ?? null
        const params = message.params || {}
        return await crmApi.fetchTasks(wsId, token, params)
      } catch (err) {
        return {
          success: false,
          data: [],
          error: err.message || 'Failed to fetch tasks',
        }
      }
    }

    case 'FETCH_MEMBERS':
    case 'GET_WORKSPACE_MEMBERS': {
      try {
        const wsId = message.workspaceId ?? null
        const token = message.token ?? null
        const params = message.params || {}
        return await crmApi.fetchMembers(wsId, token, params)
      } catch (err) {
        return {
          success: false,
          data: [],
          error: err.message || 'Failed to fetch workspace members',
        }
      }
    }

    case 'CREATE_TASK': {
      try {
        const taskData = message.taskData || {}
        const token = message.token ?? null
        return await crmApi.createTask(taskData, token)
      } catch (err) {
        return {
          success: false,
          data: null,
          error: err.message || 'Failed to create task',
        }
      }
    }


    case 'STORAGE_TEST': {
      const testKey = 'last_test_' + Date.now()
      const testPayload = { runAt: new Date().toISOString(), status: 'TEST_PASSED' }
      await extensionStorage.save(testKey, testPayload)
      const retrieved = await extensionStorage.get(testKey)
      return {
        success: true,
        savedKey: testKey,
        retrievedData: retrieved,
      }
    }

    case 'NOTIFY_CONTENT_SCRIPT': {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tabs || tabs.length === 0) {
        return { success: false, error: 'No active tab found' }
      }
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'PING_CONTENT_SCRIPT',
          data: message.data,
        })
        return { success: true, tabId: tabs[0].id, response }
      } catch (err) {
        return { success: false, error: 'Could not communicate with content script: ' + err.message }
      }
    }

    default:
      return { success: false, data: null, error: 'Unknown message type: ' + message?.type }
  }
}
