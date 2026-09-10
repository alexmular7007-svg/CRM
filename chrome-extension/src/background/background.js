/**
 * TaskFlow CRM - Background Service Worker
 * Clean Manifest V3 service worker routing messages between popup and CRM API service.
 */

import { crmApi, getStorage, setStorage, clearStorage } from '../services/crmApi.js'

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TaskFlow CRM] Extension installed and service worker ready.')
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((err) => {
      console.error('[TaskFlow CRM Background] Error handling message:', message?.type, err)
      sendResponse({ success: false, error: err.message || 'Internal background worker error' })
    })
  return true // Async response
})

async function handleMessage(message, sender) {
  if (!message || !message.type) {
    return { success: false, error: 'Message type is required' }
  }

  switch (message.type) {
    // Phase 1: Hello World Greeting
    case 'HELLO_WORLD':
      return {
        success: true,
        message: 'Hello from TaskFlow!',
        version: '1.0.0',
      }

    // Authentication & Storage
    case 'LOGIN':
      return await crmApi.login(message.email, message.password)

    case 'LOGOUT':
      return await crmApi.logout()

    case 'GET_AUTH': {
      const store = await getStorage()
      return {
        success: true,
        data: {
          authenticated: Boolean(store.authToken),
          user: store.authenticatedUser,
          workspaceId: store.workspaceId,
          availableWorkspaces: store.availableWorkspaces || [],
          endpoint: store.crmEndpoint,
        },
      }
    }

    case 'SET_ENDPOINT':
      await crmApi.setEndpoint(message.endpoint)
      return { success: true }

    case 'SWITCH_WORKSPACE':
      await setStorage({ workspaceId: message.workspaceId })
      return { success: true, workspaceId: message.workspaceId }

    // Workspaces & Members
    case 'GET_WORKSPACES':
      return await crmApi.getWorkspaces(message.token)

    case 'GET_MEMBERS':
    case 'FETCH_MEMBERS':
      return await crmApi.getWorkspaceMembers(message.workspaceId, message.token)

    // Projects
    case 'GET_PROJECTS':
    case 'FETCH_PROJECTS':
      return await crmApi.getProjects(message.workspaceId, message.token)

    // Task CRUD API (Phase 2 & Phase 3)
    case 'GET_TASKS':
    case 'FETCH_TASKS':
      return await crmApi.getTasks(message.workspaceId, message.token, message.page, message.size)

    case 'CREATE_TASK':
      return await crmApi.createTask(message.taskData, message.token)

    case 'UPDATE_TASK_STATUS':
      return await crmApi.updateTaskStatus(
        message.taskId,
        message.status,
        message.workspaceId,
        message.token
      )

    case 'DELETE_TASK':
      return await crmApi.deleteTask(message.taskId, message.workspaceId, message.token)

    // Activity Feed (Phase 3)
    case 'GET_RECENT_ACTIVITY':
    case 'FETCH_RECENT_ACTIVITIES':
      return await crmApi.getRecentActivities(
        message.workspaceId,
        message.token,
        message.limit || 8
      )

    default:
      return { success: false, error: `Unknown message type: ${message.type}` }
  }
}
