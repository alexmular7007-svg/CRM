import { extensionStorage } from '../storage/extensionStorage.js'
import { logger } from '../utils/logger.js'

/**
 * CRM API Service
 * Handles communication between Chrome Extension and Spring Boot backend.
 * Zero hard-coded credentials: uses user-configured endpoint and optional Bearer token.
 */
export const crmApi = {
  /**
   * Check connection to the CRM backend (/actuator/health)
   * @param {string} [customEndpoint] - Optional endpoint override
   * @returns {Promise<{success: boolean, status: string, statusCode: number, latencyMs: number, data?: any, error?: string}>}
   */
  async checkConnection(customEndpoint = null) {
    const settings = await extensionStorage.get()
    const base = (customEndpoint || settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const url = `${base}/actuator/health`

    const startTime = performance.now()
    try {
      logger.info('Pinging CRM backend:', url)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(settings.authToken ? { Authorization: `Bearer ${settings.authToken}` } : {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const latencyMs = Math.round(performance.now() - startTime)

      if (response.ok) {
        let body = null
        try {
          body = await response.json()
        } catch {
          body = { status: 'UP' }
        }
        logger.success(`CRM Connection OK (${latencyMs}ms):`, body)
        return {
          success: true,
          status: 'CONNECTED',
          statusCode: response.status,
          latencyMs,
          data: body,
        }
      } else {
        logger.warn(`CRM Connection returned status ${response.status} (${latencyMs}ms)`)
        return {
          success: false,
          status: 'DISCONNECTED',
          statusCode: response.status,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime)
      const isTimeout = err.name === 'AbortError'
      const errorMsg = isTimeout ? 'Connection timed out (5s)' : err.message || 'Network unreachable'
      logger.error('CRM Connection failed:', errorMsg)
      return {
        success: false,
        status: 'DISCONNECTED',
        statusCode: 0,
        latencyMs,
        error: errorMsg,
      }
    }
  },

  /**
   * Fetch registered Chrome Extensions for the configured workspace
   * @returns {Promise<{success: boolean, data?: any[], statusCode: number, latencyMs: number, error?: string}>}
   */
  async fetchExtensions() {
    const settings = await extensionStorage.get()
    const base = (settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const workspaceId = settings.workspaceId || 1
    const endpoint = `${base}/api/workspaces/${workspaceId}/chrome-extensions`

    const startTime = performance.now()
    try {
      logger.info('Fetching extensions from:', endpoint)
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(settings.authToken ? { Authorization: `Bearer ${settings.authToken}` } : {}),
        },
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (response.ok) {
        const payload = await response.json()
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
          data: payload?.data?.content || payload?.data || [],
        }
      } else {
        return {
          success: false,
          statusCode: response.status,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }
    } catch (err) {
      return {
        success: false,
        statusCode: 0,
        latencyMs: Math.round(performance.now() - startTime),
        error: err.message || 'Network request failed',
      }
    }
  },

  /**
   * Login user with email & password
   * POST /api/auth/login
   * @param {string} email
   * @param {string} password
   * @param {string} [customEndpoint]
   * @returns {Promise<{success: boolean, token?: string, user?: any, error?: string}>}
   */
  async login(email, password, customEndpoint = null) {
    const settings = await extensionStorage.get()
    const base = (customEndpoint || settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const url = `${base}/api/auth/login`

    try {
      logger.info('Attempting login:', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const payload = await response.json().catch(() => null)
      if (response.ok && payload && payload.success && payload.data?.token) {
        logger.success('Login successful for user:', payload.data.user?.email)
        return {
          success: true,
          token: payload.data.token,
          user: payload.data.user,
        }
      } else {
        const errorMsg = payload?.message || `Login failed: HTTP ${response.status}`
        logger.warn('Login rejected:', errorMsg)
        return {
          success: false,
          error: errorMsg,
        }
      }
    } catch (err) {
      logger.error('Login network error:', err)
      return {
        success: false,
        error: err.message || 'Unable to connect to CRM server. Check server status and endpoint URL.',
      }
    }
  },

  /**
   * Validate session token
   * GET /api/users/me
   * @param {string} token
   * @param {string} [customEndpoint]
   * @returns {Promise<{success: boolean, valid: boolean, user?: any, statusCode?: number, error?: string}>}
   */
  async validateSession(token, customEndpoint = null) {
    if (!token || !token.trim()) {
      return { success: false, valid: false, error: 'No token provided' }
    }

    const settings = await extensionStorage.get()
    const base = (customEndpoint || settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const url = `${base}/api/users/me`

    try {
      logger.info('Validating session token with:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
      })

      if (response.ok) {
        const payload = await response.json().catch(() => null)
        const user = payload?.data || null
        return {
          success: true,
          valid: true,
          statusCode: response.status,
          user,
        }
      } else {
        return {
          success: false,
          valid: false,
          statusCode: response.status,
          error: response.status === 401 || response.status === 403 ? 'Session expired' : `HTTP ${response.status}`,
        }
      }
    } catch (err) {
      logger.error('Session validation error:', err)
      return {
        success: false,
        valid: false,
        statusCode: 0,
        error: err.message || 'Network error during validation',
      }
    }
  },

  /**
   * Fetch all workspaces accessible to current user
   * GET /api/workspaces?page=0&size=50
   * @param {string} token
   * @param {string} [customEndpoint]
   * @returns {Promise<{success: boolean, data: any[], error?: string}>}
   */
  async fetchWorkspaces(token = null, customEndpoint = null) {
    const settings = await extensionStorage.get()
    const base = (customEndpoint || settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const authToken = token !== undefined && token !== null ? token : settings.authToken
    if (!authToken || !authToken.trim()) {
      return { success: false, data: [], error: 'Authentication required to fetch workspaces' }
    }

    const url = `${base}/api/workspaces?page=0&size=50`

    try {
      logger.info('Fetching accessible workspaces from:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken.trim()}`,
        },
      })

      if (response.ok) {
        const payload = await response.json().catch(() => null)
        const rawWorkspaces = payload?.data?.content !== undefined
          ? payload.data.content
          : (Array.isArray(payload?.data) ? payload.data : [])
        logger.success(`Fetched ${rawWorkspaces.length} accessible workspaces`)
        return {
          success: true,
          data: rawWorkspaces,
        }
      } else {
        return {
          success: false,
          data: [],
          error: `HTTP ${response.status}: Failed to fetch workspaces`,
        }
      }
    } catch (err) {
      logger.error('Fetch workspaces network error:', err)
      return {
        success: false,
        data: [],
        error: err.message || 'Network error',
      }
    }
  },

  /**
   * Fetch real CRM tasks for the configured or specified workspace
   * API: GET /api/tasks?workspaceId={workspaceId}&page=0&size=10&sortBy=createdAt&sortDir=desc
   * @param {number|string} [workspaceId] - Workspace ID
   * @param {string} [token] - Optional JWT token
   * @param {object} [params] - Pagination & sort options
   * @returns {Promise<{success: boolean, data: any[], statusCode: number, latencyMs: number, error?: string}>}
   */
  async fetchTasks(workspaceId = null, token = null, params = {}) {
    const settings = await extensionStorage.get()
    const base = (settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const wsId = workspaceId !== undefined && workspaceId !== null ? workspaceId : settings.workspaceId
    const authToken = token !== undefined && token !== null ? token : settings.authToken

    if (!authToken || !authToken.trim()) {
      return {
        success: false,
        statusCode: 401,
        latencyMs: 0,
        data: [],
        error: 'Authentication required. Please sign in.',
      }
    }

    if (!wsId) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        data: [],
        error: 'No workspace selected. Please select a workspace.',
      }
    }

    const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params
    const query = new URLSearchParams({
      workspaceId: wsId.toString(),
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir,
    })

    const endpoint = `${base}/api/tasks?${query.toString()}`
    const startTime = performance.now()

    try {
      logger.info('Fetching tasks from CRM:', endpoint)
      const headers = {
        Accept: 'application/json',
      }
      if (authToken && authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (response.ok) {
        const payload = await response.json()
        // Extract tasks from ApiResponse: payload.data.content or payload.data
        const rawTasks = payload?.data?.content !== undefined 
          ? payload.data.content 
          : (Array.isArray(payload?.data) ? payload.data : [])

        logger.success(`Fetched ${rawTasks.length} tasks (${latencyMs}ms)`)
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
          data: rawTasks,
          totalElements: payload?.data?.totalElements ?? rawTasks.length,
          totalPages: payload?.data?.totalPages ?? 1,
        }
      } else {
        let errMsg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errBody = await response.json()
          if (errBody?.message) {
            errMsg = errBody.message
          }
        } catch {}

        logger.warn(`Fetch tasks failed: ${errMsg} (${latencyMs}ms)`)
        return {
          success: false,
          statusCode: response.status,
          latencyMs,
          data: [],
          error: errMsg,
        }
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime)
      logger.error('Fetch tasks network error:', err)
      return {
        success: false,
        statusCode: 0,
        latencyMs,
        data: [],
        error: err.message || 'Network request failed',
      }
    }
  },

  /**
   * Fetch members of a workspace to populate assignee dropdowns
   * API: GET /api/workspaces/{workspaceId}/members?page=0&size=50
   * @param {number|string} [workspaceId] - Workspace ID
   * @param {string} [token] - Optional JWT token
   * @param {object} [params] - Pagination options
   * @returns {Promise<{success: boolean, data: any[], statusCode: number, latencyMs: number, error?: string}>}
   */
  async fetchMembers(workspaceId = null, token = null, params = {}) {
    const settings = await extensionStorage.get()
    const base = (settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const wsId = workspaceId !== undefined && workspaceId !== null ? workspaceId : settings.workspaceId
    const authToken = token !== undefined && token !== null ? token : settings.authToken

    if (!authToken || !authToken.trim()) {
      return {
        success: false,
        statusCode: 401,
        latencyMs: 0,
        data: [],
        error: 'Authentication required. Please sign in.',
      }
    }

    if (!wsId) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        data: [],
        error: 'No workspace selected.',
      }
    }

    const { page = 0, size = 50 } = params
    const endpoint = `${base}/api/workspaces/${wsId}/members?page=${page}&size=${size}`
    const startTime = performance.now()

    try {
      logger.info('Fetching workspace members from CRM:', endpoint)
      const headers = {
        Accept: 'application/json',
      }
      if (authToken && authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (response.ok) {
        const payload = await response.json()
        const members = payload?.data?.content !== undefined
          ? payload.data.content
          : (Array.isArray(payload?.data) ? payload.data : [])

        logger.success(`Fetched ${members.length} workspace members (${latencyMs}ms)`)
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
          data: members,
        }
      } else {
        let errMsg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errBody = await response.json()
          if (errBody?.message) errMsg = errBody.message
        } catch {}

        logger.warn(`Fetch members failed: ${errMsg} (${latencyMs}ms)`)
        return {
          success: false,
          statusCode: response.status,
          latencyMs,
          data: [],
          error: errMsg,
        }
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime)
      logger.error('Fetch members network error:', err)
      return {
        success: false,
        statusCode: 0,
        latencyMs,
        data: [],
        error: err.message || 'Network request failed',
      }
    }
  },

  /**
   * Create a real CRM task in the specified workspace
   * API: POST /api/tasks
   * @param {object} taskData - Task payload matching TaskCreateRequest
   * @param {string} [token] - Optional JWT token
   * @returns {Promise<{success: boolean, data: any, statusCode: number, latencyMs: number, error?: string}>}
   */
  async createTask(taskData, token = null) {
    const settings = await extensionStorage.get()
    const base = (settings.crmEndpoint || 'http://localhost:8080').replace(/\/$/, '')
    const wsId = taskData.workspaceId !== undefined && taskData.workspaceId !== null ? taskData.workspaceId : settings.workspaceId
    const authToken = token !== undefined && token !== null ? token : settings.authToken

    if (!authToken || !authToken.trim()) {
      return {
        success: false,
        statusCode: 401,
        latencyMs: 0,
        data: null,
        error: 'Authentication required. Please sign in.',
      }
    }

    if (!wsId) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        data: null,
        error: 'No workspace selected.',
      }
    }

    const payload = {
      workspaceId: wsId,
      title: taskData.title ? taskData.title.trim() : '',
      description: taskData.description ? taskData.description.trim() : '',
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate || null,
      assignedToId: taskData.assignedToId || null,
      assignedToName: taskData.assignedToName || null,
      projectId: taskData.projectId || null,
      projectName: taskData.projectName || null,
    }

    const endpoint = `${base}/api/tasks`
    const startTime = performance.now()

    try {
      logger.info('Creating task in CRM:', endpoint, payload.title)
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      if (authToken && authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (response.ok) {
        const resBody = await response.json()
        const createdTask = resBody?.data || resBody
        logger.success(`Task created successfully ID: ${createdTask?.id} (${latencyMs}ms)`)
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
          data: createdTask,
          message: resBody?.message || 'Task created successfully',
        }
      } else {
        let errMsg = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errBody = await response.json()
          if (errBody?.message) {
            errMsg = errBody.message
          } else if (errBody?.data && typeof errBody.data === 'object') {
            errMsg = Object.values(errBody.data)[0] || errMsg
          }
        } catch {}

        logger.warn(`Task creation failed: ${errMsg} (${latencyMs}ms)`)
        return {
          success: false,
          statusCode: response.status,
          latencyMs,
          data: null,
          error: errMsg,
        }
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime)
      logger.error('Create task network error:', err)
      return {
        success: false,
        statusCode: 0,
        latencyMs,
        data: null,
        error: err.message || 'Network request failed',
      }
    }
  },
}


