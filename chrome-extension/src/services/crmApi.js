/**
 * TaskFlow CRM - API Client Service
 * Clean REST API client communicating between the Chrome Extension and CRM backend.
 * Architecture: popup.js -> background.js -> crmApi.js -> REST API
 */

const DEFAULT_ENDPOINT = 'https://crm-production-932d.up.railway.app'

// In-memory fallback for unit test environments
const memoryStorage = {
  crmEndpoint: DEFAULT_ENDPOINT,
  authToken: '',
  authenticatedUser: null,
  workspaceId: null,
  availableWorkspaces: [],
}

/**
 * Storage helper abstraction for chrome.storage.local / in-memory
 */
export async function getStorage(key = null) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const merged = { ...memoryStorage, ...(items || {}) }
        resolve(key ? merged[key] : merged)
      })
    })
  }
  return key ? memoryStorage[key] : { ...memoryStorage }
}

export async function setStorage(items) {
  Object.assign(memoryStorage, items)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve)
    })
  }
}

export async function clearStorage() {
  memoryStorage.authToken = ''
  memoryStorage.authenticatedUser = null
  memoryStorage.workspaceId = null
  memoryStorage.availableWorkspaces = []
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(
        ['authToken', 'authenticatedUser', 'workspaceId', 'availableWorkspaces'],
        resolve
      )
    })
  }
}

export function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.content)) return payload.content
  if (payload.data) {
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.data.content)) return payload.data.content
  }
  return []
}

export const crmApi = {
  /**
   * Get effective CRM base URL
   */
  async getEndpoint() {
    const store = await getStorage()
    return (store.crmEndpoint || DEFAULT_ENDPOINT).replace(/\/$/, '')
  },

  /**
   * Update CRM base URL
   */
  async setEndpoint(endpoint) {
    await setStorage({ crmEndpoint: endpoint })
  },

  /**
   * Authenticate user with CRM REST API
   * POST /api/auth/login
   */
  async login(email, password) {
    const base = await this.getEndpoint()
    try {
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || `Login failed with HTTP ${response.status}`,
        }
      }

      const token = payload?.data?.token || payload?.token
      const user = payload?.data?.user || payload?.user

      if (!token) {
        return { success: false, error: 'No authentication token returned by server' }
      }

      // Fetch user's workspaces
      let workspaces = []
      try {
        const wsRes = await fetch(`${base}/api/workspaces`, {
          method: 'GET',
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        })
        if (wsRes.ok) {
          const wsData = await wsRes.json()
          workspaces = extractList(wsData)
        }
      } catch (err) {
        console.warn('Could not auto-fetch workspaces on login:', err)
      }

      const selectedWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null

      await setStorage({
        authToken: token,
        authenticatedUser: user,
        availableWorkspaces: workspaces,
        workspaceId: selectedWorkspaceId,
      })

      return {
        success: true,
        data: {
          token,
          user,
          workspaces,
          selectedWorkspaceId,
        },
      }
    } catch (err) {
      return { success: false, error: err.message || 'Network error during login' }
    }
  },

  /**
   * Clear session
   */
  async logout() {
    await clearStorage()
    return { success: true }
  },

  /**
   * Get user workspaces
   * GET /api/workspaces
   */
  async getWorkspaces(token = null) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const base = await this.getEndpoint()

    if (!authToken) {
      return { success: false, error: 'Authentication required' }
    }

    try {
      const response = await fetch(`${base}/api/workspaces`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }
      const data = await response.json()
      const workspaces = extractList(data)
      await setStorage({ availableWorkspaces: workspaces })
      return { success: true, data: workspaces }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  /**
   * Get workspace members for assignment
   * GET /api/workspaces/{workspaceId}/members
   */
  async getWorkspaceMembers(workspaceId = null, token = null) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const wsId = workspaceId || store.workspaceId
    const base = await this.getEndpoint()

    if (!authToken || !wsId) {
      return { success: false, data: [], error: 'Workspace and authentication required' }
    }

    try {
      const response = await fetch(`${base}/api/workspaces/${wsId}/members`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        return { success: false, data: [], error: `HTTP ${response.status}` }
      }
      const data = await response.json()
      const members = extractList(data)
      return { success: true, data: members }
    } catch (err) {
      return { success: false, data: [], error: err.message }
    }
  },

  /**
   * GET /api/tasks?workspaceId={workspaceId}
   * Phase 2 / 3: List tasks scoped to workspace
   */
  async getTasks(workspaceId = null, token = null, page = 0, size = 20) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const wsId = workspaceId || store.workspaceId
    const base = await this.getEndpoint()

    if (!authToken || !wsId) {
      return { success: false, data: [], error: 'Workspace and authentication required' }
    }

    try {
      const url = `${base}/api/tasks?workspaceId=${wsId}&page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        return { success: false, data: [], error: `HTTP ${response.status}` }
      }
      const json = await response.json()
      const tasks = extractList(json)
      return { success: true, data: tasks }
    } catch (err) {
      return { success: false, data: [], error: err.message }
    }
  },

  /**
   * POST /api/tasks
   * Phase 2 / 3: Create / Assign new task
   */
  async createTask(taskData, token = null) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const base = await this.getEndpoint()
    const wsId = taskData?.workspaceId || store.workspaceId

    if (!authToken || !wsId) {
      return { success: false, error: 'Workspace and authentication required' }
    }

    const payload = {
      workspaceId: Number(wsId),
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate || null,
      assignedToId: taskData.assignedToId ? Number(taskData.assignedToId) : null,
      projectId: taskData.projectId ? Number(taskData.projectId) : null,
    }

    try {
      const response = await fetch(`${base}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: json?.message || `HTTP ${response.status}` }
      }
      return { success: true, data: json?.data || json }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  /**
   * PATCH /api/tasks/{taskId}/status
   * Phase 2 / 3: Update task status (TODO <-> DONE)
   */
  async updateTaskStatus(taskId, status, workspaceId = null, token = null) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const wsId = workspaceId || store.workspaceId
    const base = await this.getEndpoint()

    if (!authToken || !wsId || !taskId) {
      return { success: false, error: 'Task ID, workspace, and authentication required' }
    }

    try {
      const url = `${base}/api/tasks/${taskId}/status`
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          workspaceId: Number(wsId),
          status: status.toUpperCase(),
        }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        return { success: false, error: json?.message || `HTTP ${response.status}` }
      }
      return { success: true, data: json?.data || json }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  /**
   * DELETE /api/tasks/{taskId}?workspaceId={workspaceId}
   * Phase 2 / 3: Delete task
   */
  async deleteTask(taskId, workspaceId = null, token = null) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const wsId = workspaceId || store.workspaceId
    const base = await this.getEndpoint()

    if (!authToken || !wsId || !taskId) {
      return { success: false, error: 'Task ID, workspace, and authentication required' }
    }

    try {
      const url = `${base}/api/tasks/${taskId}?workspaceId=${wsId}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        return { success: false, error: json?.message || `HTTP ${response.status}` }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },

  /**
   * GET /api/analytics/recent?workspaceId={workspaceId}&limit={limit}
   * Phase 3: Fetch workspace recent activity
   */
  async getRecentActivities(workspaceId = null, token = null, limit = 8) {
    const store = await getStorage()
    const authToken = token || store.authToken
    const wsId = workspaceId || store.workspaceId
    const base = await this.getEndpoint()

    if (!authToken || !wsId) {
      return { success: false, data: [], error: 'Workspace and authentication required' }
    }

    try {
      const url = `${base}/api/analytics/recent?workspaceId=${wsId}&limit=${limit}`
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      })
      if (!response.ok) {
        return { success: false, data: [], error: `HTTP ${response.status}` }
      }
      const json = await response.json()
      const activities = extractList(json)
      return { success: true, data: activities }
    } catch (err) {
      return { success: false, data: [], error: err.message }
    }
  },
}