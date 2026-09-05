import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Code,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import { chromeExtensionService } from '../../services/chromeExtensionService'

const TYPE_BADGES = {
  API_CRUD: {
    label: 'API CRUD',
    icon: Terminal,
    style: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  STORAGE_CRUD: {
    label: 'Storage CRUD',
    icon: Database,
    style: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  DOM_INJECTION: {
    label: 'DOM Injection',
    icon: Layers,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  INTEGRATION: {
    label: 'Integration',
    icon: Sparkles,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  BROWSER: {
    label: 'Browser (Playwright)',
    icon: Code,
    style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
}

export default function TestSuiteModal({
  isOpen,
  onClose,
  extensionId,
  suite = null,
  testCases = [],
}) {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [stopOnFailure, setStopOnFailure] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])

  useEffect(() => {
    if (suite) {
      setName(suite.name || '')
      setDescription(suite.description || '')
      setEnabled(suite.enabled !== false)
      setStopOnFailure(Boolean(suite.stopOnFailure))
      if (Array.isArray(suite.items)) {
        const sorted = [...suite.items].sort(
          (a, b) => (a.executionOrder || 0) - (b.executionOrder || 0)
        )
        setSelectedItems(
          sorted.map((item, idx) => ({
            testCaseId: item.testCaseId,
            testCaseName: item.testCaseName || `Test Case #${item.testCaseId}`,
            testCaseType: item.testCaseType || 'API_CRUD',
            executionOrder: idx + 1,
            enabled: item.enabled !== false,
          }))
        )
      } else {
        setSelectedItems([])
      }
    } else {
      setName('')
      setDescription('')
      setEnabled(true)
      setStopOnFailure(false)
      setSelectedItems([])
    }
  }, [suite, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.createTestSuite(currentWorkspace?.id, extensionId, payload),
    onSuccess: () => {
      toast.success('Test suite created successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-suites', currentWorkspace?.id, extensionId] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create test suite')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.updateTestSuite(currentWorkspace?.id, extensionId, suite.id, payload),
    onSuccess: () => {
      toast.success('Test suite updated successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-suites', currentWorkspace?.id, extensionId] })
      queryClient.invalidateQueries({ queryKey: ['extension-test-suite', currentWorkspace?.id, extensionId, suite.id] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update test suite')
    },
  })

  const handleAddTestCase = (tc) => {
    if (selectedItems.some((item) => String(item.testCaseId) === String(tc.id))) {
      toast.error(`"${tc.name}" is already in this suite`)
      return
    }

    const newItem = {
      testCaseId: tc.id,
      testCaseName: tc.name,
      testCaseType: tc.testType,
      executionOrder: selectedItems.length + 1,
      enabled: true,
    }

    setSelectedItems([...selectedItems, newItem])
  }

  const handleRemoveItem = (index) => {
    const updated = selectedItems
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, executionOrder: idx + 1 }))
    setSelectedItems(updated)
  }

  const handleMoveUp = (index) => {
    if (index <= 0) return
    const updated = [...selectedItems]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    const reordered = updated.map((item, idx) => ({ ...item, executionOrder: idx + 1 }))
    setSelectedItems(reordered)
  }

  const handleMoveDown = (index) => {
    if (index >= selectedItems.length - 1) return
    const updated = [...selectedItems]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    const reordered = updated.map((item, idx) => ({ ...item, executionOrder: idx + 1 }))
    setSelectedItems(reordered)
  }

  const handleToggleItemEnabled = (index) => {
    const updated = [...selectedItems]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    setSelectedItems(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Suite name is required')
      return
    }

    if (trimmedName.length > 255) {
      toast.error('Suite name cannot exceed 255 characters')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please select at least one test case for this suite')
      return
    }

    const payload = {
      name: trimmedName,
      description: description ? description.trim() : null,
      enabled: Boolean(enabled),
      stopOnFailure: Boolean(stopOnFailure),
      items: selectedItems.map((item, idx) => ({
        testCaseId: item.testCaseId,
        executionOrder: idx + 1,
        enabled: item.enabled !== false,
      })),
    }

    if (suite) {
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
      title={suite ? 'Edit Test Suite' : 'Create New Test Suite'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Suite Name *
          </label>
          <input
            type="text"
            required
            maxLength={255}
            placeholder="e.g. Smoke Tests Suite / Full Regression"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Brief overview of what this suite tests..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Suite Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-gray-50 dark:bg-[#0D1117]/60 border border-gray-200 dark:border-[#30363D]">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Enable Test Suite</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={stopOnFailure}
              onChange={(e) => setStopOnFailure(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span>Stop on Failure</span>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                Halt remaining items if an earlier test fails.
              </p>
            </div>
          </label>
        </div>

        {/* Selected Suite Items Composition */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
              Suite Composition & Execution Order ({selectedItems.length})
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Drag-free Up/Down reordering
            </span>
          </div>

          {selectedItems.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#30363D] text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#161B22]/50">
              No test cases added to this suite yet. Select from the available list below.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedItems.map((item, idx) => {
                const typeCfg = TYPE_BADGES[item.testCaseType] || TYPE_BADGES.API_CRUD
                const TypeIcon = typeCfg.icon

                return (
                  <div
                    key={`${item.testCaseId}-${idx}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-2 ${
                      item.enabled
                        ? 'bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]'
                        : 'bg-gray-50/75 dark:bg-[#0D1117]/60 border-gray-200 dark:border-[#30363D] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        #{idx + 1}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${typeCfg.style}`}
                      >
                        <TypeIcon size={12} />
                        {typeCfg.label}
                      </span>

                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-xs">
                        {item.testCaseName}
                      </span>

                      {!item.enabled && (
                        <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">
                          (Disabled)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 self-end sm:self-auto">
                      {/* Item-level enable toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleItemEnabled(idx)}
                        className="px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title={item.enabled ? 'Click to disable item' : 'Click to enable item'}
                      >
                        {item.enabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={13} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <XCircle size={13} /> Inactive
                          </span>
                        )}
                      </button>

                      {/* Reorder Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#21262D]"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>

                      {/* Reorder Down */}
                      <button
                        type="button"
                        disabled={idx === selectedItems.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#21262D]"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Remove from suite"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Extension Test Cases */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-[#30363D]">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Available Test Cases ({testCases.length})
          </label>

          {testCases.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No test cases found for this extension. Create test cases in the Test Cases tab first.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5">
              {testCases.map((tc) => {
                const isSelected = selectedItems.some(
                  (item) => String(item.testCaseId) === String(tc.id)
                )
                const typeCfg = TYPE_BADGES[tc.testType] || TYPE_BADGES.API_CRUD
                const TypeIcon = typeCfg.icon

                return (
                  <div
                    key={tc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-xs gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${typeCfg.style}`}
                      >
                        <TypeIcon size={11} />
                        {typeCfg.label}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {tc.name}
                      </span>
                      {!tc.enabled && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                          Disabled
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => handleAddTestCase(tc)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors self-end sm:self-auto ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                      }`}
                    >
                      {isSelected ? (
                        'Added'
                      ) : (
                        <>
                          <Plus size={13} /> Add to Suite
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
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
            {suite ? 'Save Changes' : 'Create Suite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
