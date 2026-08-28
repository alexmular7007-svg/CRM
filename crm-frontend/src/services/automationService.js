import api from './api'

const unwrap = (response) => response?.data ?? response
const automationPath = (workspaceId, automationId = '') =>
  `/workspaces/${workspaceId}/automations${automationId ? `/${automationId}` : ''}`

export const automationService = {
  /**
   * List all automations in a workspace
   */
  async listAutomations(workspaceId, params = {}) {
    return unwrap(
      await api.get(automationPath(workspaceId), {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          sortBy: params.sortBy || 'createdAt',
          ...(params.status && { status: params.status }),
        },
      })
    )
  },

  /**
   * Get a single automation by ID
   */
  async getAutomation(workspaceId, automationId) {
    return unwrap(await api.get(automationPath(workspaceId, automationId)))
  },

  /**
   * Create a new automation
   */
  async createAutomation(workspaceId, data) {
    return unwrap(await api.post(automationPath(workspaceId), data))
  },

  /**
   * Update an automation
   */
  async updateAutomation(workspaceId, automationId, data) {
    return unwrap(await api.put(automationPath(workspaceId, automationId), data))
  },

  /**
   * Delete an automation
   */
  async deleteAutomation(workspaceId, automationId) {
    return unwrap(await api.delete(automationPath(workspaceId, automationId)))
  },

  /**
   * Activate an automation (DRAFT or PAUSED → ACTIVE)
   * Backend: POST /api/workspaces/{workspaceId}/automations/{automationId}/activate
   */
  async activateAutomation(workspaceId, automationId) {
    return unwrap(await api.post(`${automationPath(workspaceId, automationId)}/activate`))
  },

  /**
   * Pause an automation (ACTIVE → PAUSED)
   * Backend: POST /api/workspaces/{workspaceId}/automations/{automationId}/pause
   */
  async pauseAutomation(workspaceId, automationId) {
    return unwrap(await api.post(`${automationPath(workspaceId, automationId)}/pause`))
  },

  /**
   * Get execution history for an automation
   */
  async getExecutions(workspaceId, automationId, params = {}) {
    return unwrap(
      await api.get(`/automations/${automationId}/executions`, {
        params: {
          workspaceId,
          page: params.page || 0,
          size: params.size || 10,
          sortBy: params.sortBy || 'createdAt',
          sortDirection: params.sortDirection || 'desc',
        },
      })
    )
  },

  async getExecution(workspaceId, automationId, executionId) {
    return unwrap(
      await api.get(`/automations/${automationId}/executions/${executionId}`, {
        params: { workspaceId },
      })
    )
  },

  /**
   * Get execution metrics for an automation
   */
  async getExecutionMetrics(workspaceId, automationId) {
    return unwrap(
      await api.get(`/automations/${automationId}/executions/metrics`, {
        params: { workspaceId },
      })
    )
  },

  /**
   * Add a step to an automation workflow
   */
  async addStep(workspaceId, automationId, stepData) {
    return unwrap(
      await api.post(`${automationPath(workspaceId, automationId)}/steps`, stepData)
    )
  },

  /**
   * Update a step in an automation workflow
   */
  async updateStep(workspaceId, automationId, stepId, stepData) {
    return unwrap(
      await api.put(
        `${automationPath(workspaceId, automationId)}/steps/${stepId}`,
        stepData
      )
    )
  },

  /**
   * Delete a step from an automation workflow
   */
  async deleteStep(workspaceId, automationId, stepId) {
    return unwrap(
      await api.delete(`${automationPath(workspaceId, automationId)}/steps/${stepId}`)
    )
  },

  /**
   * Reorder a step in the automation workflow
   * Backend: POST /api/workspaces/{workspaceId}/automations/{automationId}/steps/{stepId}/reorder?newOrder={order}
   * @param stepIds - Deprecated parameter (for backward compatibility)
   * @param newOrder - New order position for the step (pass in second parameter)
   */
  async reorderSteps(workspaceId, automationId, stepId, newOrder) {
    // Support both old API (stepIds array) and new API (stepId + newOrder)
    if (Array.isArray(stepId)) {
      // Old behavior: reorderSteps(workspaceId, automationId, [stepIds])
      // This is now a no-op for backward compatibility
      console.warn('reorderSteps with stepIds array is deprecated. Use reorderStep(workspaceId, automationId, stepId, newOrder)')
      return Promise.resolve({})
    }
    // New behavior: reorderStep(workspaceId, automationId, stepId, newOrder)
    return unwrap(
      await api.post(
        `${automationPath(workspaceId, automationId)}/steps/${stepId}/reorder`,
        null,
        { params: { newOrder } }
      )
    )
  },

  /**
   * Get all steps for an automation
   */
  async getSteps(workspaceId, automationId) {
    return unwrap(
      await api.get(`${automationPath(workspaceId, automationId)}/steps`)
    )
  },
}
