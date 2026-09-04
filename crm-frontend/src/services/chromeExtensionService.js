import api from './api'

const unwrap = (response) => response?.data ?? response

const extensionPath = (workspaceId, extensionId = '') =>
  `/workspaces/${workspaceId}/chrome-extensions${extensionId ? `/${extensionId}` : ''}`

const testCasePath = (workspaceId, extensionId, testCaseId = '') =>
  `${extensionPath(workspaceId, extensionId)}/test-cases${testCaseId ? `/${testCaseId}` : ''}`

export const chromeExtensionService = {
  /**
   * List all Chrome Extensions in a workspace (paginated + search)
   */
  async listExtensions(workspaceId, params = {}) {
    return unwrap(
      await api.get(extensionPath(workspaceId), {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          ...(params.search && { search: params.search }),
          ...(params.sort && { sort: params.sort }),
        },
      })
    )
  },

  /**
   * Get a single Chrome Extension by ID
   */
  async getExtension(workspaceId, extensionId) {
    return unwrap(await api.get(extensionPath(workspaceId, extensionId)))
  },

  /**
   * Create a new Chrome Extension
   */
  async createExtension(workspaceId, data) {
    return unwrap(await api.post(extensionPath(workspaceId), data))
  },

  /**
   * Update a Chrome Extension
   */
  async updateExtension(workspaceId, extensionId, data) {
    return unwrap(await api.put(extensionPath(workspaceId, extensionId), data))
  },

  /**
   * Delete (archive) a Chrome Extension
   */
  async deleteExtension(workspaceId, extensionId) {
    return unwrap(await api.delete(extensionPath(workspaceId, extensionId)))
  },

  /**
   * List all test cases for an extension
   */
  async listTestCases(workspaceId, extensionId) {
    return unwrap(await api.get(testCasePath(workspaceId, extensionId)))
  },

  /**
   * Get a single test case by ID
   */
  async getTestCase(workspaceId, extensionId, testCaseId) {
    return unwrap(await api.get(testCasePath(workspaceId, extensionId, testCaseId)))
  },

  /**
   * Create a new test case
   */
  async createTestCase(workspaceId, extensionId, data) {
    return unwrap(await api.post(testCasePath(workspaceId, extensionId), data))
  },

  /**
   * Update a test case
   */
  async updateTestCase(workspaceId, extensionId, testCaseId, data) {
    return unwrap(await api.put(testCasePath(workspaceId, extensionId, testCaseId), data))
  },

  /**
   * Delete a test case
   */
  async deleteTestCase(workspaceId, extensionId, testCaseId) {
    return unwrap(await api.delete(testCasePath(workspaceId, extensionId, testCaseId)))
  },
}
