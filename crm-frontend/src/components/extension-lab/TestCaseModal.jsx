import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import { chromeExtensionService } from '../../services/chromeExtensionService'

const CONFIG_TEMPLATES = {
  API_CRUD: {
    config: {
      operation: 'POST',
      endpoint: '/api/leads',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test.lead@example.com',
        source: 'CHROME_EXTENSION',
      },
    },
    expected: {
      statusCode: 201,
      matchFields: {
        success: true,
        'data.email': 'test.lead@example.com',
      },
    },
  },
  STORAGE_CRUD: {
    config: {
      operation: 'SET',
      storageArea: 'local',
      key: 'crm_active_lead',
      value: {
        leadId: 101,
        status: 'NEW',
        capturedAt: '2026-09-04T12:00:00Z',
      },
    },
    expected: {
      keyExists: true,
      nonEmpty: true,
    },
  },
  DOM_INJECTION: {
    config: {
      targetSelector: 'div#crm-quick-action-widget',
      action: 'CLICK',
      waitForSelector: '.notification-toast',
      timeoutMs: 3000,
    },
    expected: {
      elementVisible: true,
      textContains: 'Lead captured',
    },
  },
  INTEGRATION: {
    config: {
      flow: 'END_TO_END_EXT_SYNC',
      steps: [
        { action: 'READ_STORAGE', key: 'auth_token' },
        { action: 'FETCH_API', endpoint: '/api/workspaces' },
        { action: 'WRITE_STORAGE', key: 'cached_workspaces' },
      ],
    },
    expected: {
      allStepsPassed: true,
      maxLatencyMs: 1500,
    },
  },
}

export default function TestCaseModal({
  isOpen,
  onClose,
  extensionId,
  testCase = null,
}) {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testType: 'API_CRUD',
    configStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.config, null, 2),
    expectedStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.expected, null, 2),
    enabled: true,
    displayOrder: 0,
  })

  useEffect(() => {
    if (testCase) {
      setFormData({
        name: testCase.name || '',
        description: testCase.description || '',
        testType: testCase.testType || 'API_CRUD',
        configStr: testCase.configuration
          ? JSON.stringify(testCase.configuration, null, 2)
          : JSON.stringify(CONFIG_TEMPLATES[testCase.testType || 'API_CRUD']?.config || {}, null, 2),
        expectedStr: testCase.expectedResult
          ? JSON.stringify(testCase.expectedResult, null, 2)
          : JSON.stringify(CONFIG_TEMPLATES[testCase.testType || 'API_CRUD']?.expected || {}, null, 2),
        enabled: testCase.enabled !== false,
        displayOrder: testCase.displayOrder || 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        testType: 'API_CRUD',
        configStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.config, null, 2),
        expectedStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.expected, null, 2),
        enabled: true,
        displayOrder: 0,
      })
    }
  }, [testCase, isOpen])

  const handleTypeChange = (newType) => {
    const template = CONFIG_TEMPLATES[newType]
    setFormData((prev) => ({
      ...prev,
      testType: newType,
      configStr: template ? JSON.stringify(template.config, null, 2) : prev.configStr,
      expectedStr: template ? JSON.stringify(template.expected, null, 2) : prev.expectedStr,
    }))
  }

  const createMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.createTestCase(currentWorkspace?.id, extensionId, payload),
    onSuccess: () => {
      toast.success('Test Case created successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', String(extensionId)] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', String(extensionId)] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to create test case')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.updateTestCase(
        currentWorkspace?.id,
        extensionId,
        testCase.id,
        payload
      ),
    onSuccess: () => {
      toast.success('Test Case updated successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', String(extensionId)] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', String(extensionId)] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update test case')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Test case name is required')
      return
    }

    let parsedConfig = null
    let parsedExpected = null

    if (formData.configStr.trim()) {
      try {
        parsedConfig = JSON.parse(formData.configStr)
      } catch (err) {
        toast.error('Invalid Configuration JSON: ' + err.message)
        return
      }
    }

    if (formData.expectedStr.trim()) {
      try {
        parsedExpected = JSON.parse(formData.expectedStr)
      } catch (err) {
        toast.error('Invalid Expected Result JSON: ' + err.message)
        return
      }
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      testType: formData.testType,
      configuration: parsedConfig,
      expectedResult: parsedExpected,
      enabled: formData.enabled,
      displayOrder: Number(formData.displayOrder) || 0,
    }

    if (testCase) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={testCase ? 'Edit Test Case' : 'Create New Test Case'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Test Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Case Name *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. POST /api/leads - Create Lead"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Type
            </label>
            <select
              value={formData.testType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="API_CRUD">API CRUD</option>
              <option value="STORAGE_CRUD">Storage CRUD</option>
              <option value="DOM_INJECTION">DOM Injection</option>
              <option value="INTEGRATION">Integration</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="Detailed verification purpose..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Configuration JSON */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Configuration (JSON)
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Payload, endpoints, parameters
            </span>
          </div>
          <textarea
            rows={4}
            value={formData.configStr}
            onChange={(e) => setFormData({ ...formData, configStr: e.target.value })}
            className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-[#30363D] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Expected Result JSON */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Result / Assertions (JSON)
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Expected status, match fields
            </span>
          </div>
          <textarea
            rows={3}
            value={formData.expectedStr}
            onChange={(e) => setFormData({ ...formData, expectedStr: e.target.value })}
            className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-[#30363D] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Active Toggle & Order */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Enable Test Case for Test Runs
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Order:</span>
            <input
              type="number"
              min={0}
              max={999}
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-[#30363D] rounded bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-center"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
