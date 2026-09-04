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
}
