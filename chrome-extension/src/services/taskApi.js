import { crmApi } from './crmApi.js'

/**
 * Task API Service for Chrome Extension
 * Provides focused methods for interacting with CRM tasks and workspace members.
 * Delegates HTTP communication to crmApi.
 */
export const taskApi = {
  /**
   * Fetch tasks for a workspace from CRM backend
   * @param {number|string} [workspaceId] - Workspace ID
   * @param {string} [token] - Optional JWT bearer token override
   * @param {object} [params] - Pagination & sort parameters
   * @returns {Promise<{success: boolean, data: any[], statusCode: number, latencyMs: number, totalElements?: number, totalPages?: number, error?: string}>}
   */
  async getTasks(workspaceId = null, token = null, params = {}) {
    return crmApi.fetchTasks(workspaceId, token, params)
  },

  /**
   * Create a new task in the CRM
   * @param {object} taskData - Task creation payload
   * @param {string} [token] - Optional JWT bearer token override
   * @returns {Promise<{success: boolean, data: any, statusCode: number, latencyMs: number, error?: string}>}
   */
  async createTask(taskData, token = null) {
    return crmApi.createTask(taskData, token)
  },

  /**
   * Fetch workspace members to populate assignee dropdowns
   * @param {number|string} [workspaceId] - Workspace ID
   * @param {string} [token] - Optional JWT bearer token override
   * @param {object} [params] - Pagination options
   * @returns {Promise<{success: boolean, data: any[], statusCode: number, latencyMs: number, error?: string}>}
   */
  async getWorkspaceMembers(workspaceId = null, token = null, params = {}) {
    return crmApi.fetchMembers(workspaceId, token, params)
  },
}
