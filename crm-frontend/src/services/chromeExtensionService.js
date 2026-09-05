import api from './api'

const unwrap = (response) => response?.data ?? response

const extensionPath = (workspaceId, extensionId = '') =>
  `/workspaces/${workspaceId}/chrome-extensions${extensionId ? `/${extensionId}` : ''}`

const testCasePath = (workspaceId, extensionId, testCaseId = '') =>
  `${extensionPath(workspaceId, extensionId)}/test-cases${testCaseId ? `/${testCaseId}` : ''}`

const runPath = (workspaceId, extensionId, runId = '') =>
  `${extensionPath(workspaceId, extensionId)}/runs${runId ? `/${runId}` : ''}`

const suitePath = (workspaceId, extensionId, suiteId = '') =>
  `${extensionPath(workspaceId, extensionId)}/suites${suiteId ? `/${suiteId}` : ''}`

const suiteRunPath = (workspaceId, extensionId, suiteId, runId = '') =>
  `${suitePath(workspaceId, extensionId, suiteId)}/runs${runId ? `/${runId}` : ''}`

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

  /**
   * Start / Trigger a new test run for an extension
   */
  async createTestRun(workspaceId, extensionId) {
    return unwrap(await api.post(runPath(workspaceId, extensionId)))
  },

  /**
   * List test runs for an extension (paginated)
   */
  async listTestRuns(workspaceId, extensionId, params = {}) {
    return unwrap(
      await api.get(runPath(workspaceId, extensionId), {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          ...(params.sort && { sort: params.sort }),
        },
      })
    )
  },

  /**
   * Get a single test run with full summary and results
   */
  async getTestRun(workspaceId, extensionId, runId) {
    return unwrap(await api.get(runPath(workspaceId, extensionId, runId)))
  },

  /**
   * Cancel an active test run
   */
  async cancelTestRun(workspaceId, extensionId, runId) {
    return unwrap(await api.post(`${runPath(workspaceId, extensionId, runId)}/cancel`))
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Browser Test Execution (Phase 6B)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check Extension Runner Health
   */
  async checkRunnerHealth(workspaceId) {
    return unwrap(await api.get(`${extensionPath(workspaceId)}/runner/health`))
  },

  /**
   * Start a browser-based Playwright test run via the extension runner
   */
  async startBrowserTestRun(workspaceId, extensionId, request = {}) {
    return unwrap(await api.post(`${extensionPath(workspaceId, extensionId)}/browser-runs`, request))
  },

  /**
   * Get status & results of a browser test run
   */
  async getBrowserTestRun(workspaceId, extensionId, runId) {
    return unwrap(await api.get(`${extensionPath(workspaceId, extensionId)}/browser-runs/${runId}`))
  },

  /**
   * Cancel a browser test run
   */
  async cancelBrowserTestRun(workspaceId, extensionId, runId) {
    return unwrap(await api.post(`${extensionPath(workspaceId, extensionId)}/browser-runs/${runId}/cancel`))
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Test Suites CRUD & Execution (Phase 6D)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all test suites for an extension
   */
  async listTestSuites(workspaceId, extensionId) {
    return unwrap(await api.get(suitePath(workspaceId, extensionId)))
  },

  /**
   * Get a single test suite by ID
   */
  async getTestSuite(workspaceId, extensionId, suiteId) {
    return unwrap(await api.get(suitePath(workspaceId, extensionId, suiteId)))
  },

  /**
   * Create a new test suite
   */
  async createTestSuite(workspaceId, extensionId, payload) {
    return unwrap(await api.post(suitePath(workspaceId, extensionId), payload))
  },

  /**
   * Update a test suite
   */
  async updateTestSuite(workspaceId, extensionId, suiteId, payload) {
    return unwrap(await api.put(suitePath(workspaceId, extensionId, suiteId), payload))
  },

  /**
   * Delete a test suite
   */
  async deleteTestSuite(workspaceId, extensionId, suiteId) {
    return unwrap(await api.delete(suitePath(workspaceId, extensionId, suiteId)))
  },

  /**
   * Queue / Start a suite run
   */
  async startSuiteRun(workspaceId, extensionId, suiteId) {
    return unwrap(await api.post(suiteRunPath(workspaceId, extensionId, suiteId)))
  },

  /**
   * Get status & results of a suite run
   */
  async getSuiteRun(workspaceId, extensionId, suiteId, runId) {
    return unwrap(await api.get(suiteRunPath(workspaceId, extensionId, suiteId, runId)))
  },

  /**
   * Cancel an active suite run
   */
  async cancelSuiteRun(workspaceId, extensionId, suiteId, runId) {
    return unwrap(await api.post(`${suiteRunPath(workspaceId, extensionId, suiteId, runId)}/cancel`))
  },
}
