import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit2,
  Trash2,
  PlayCircle,
  RotateCw,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import TestSuiteModal from './TestSuiteModal'
import TestSuiteRunModal from './TestSuiteRunModal'
import { chromeExtensionService } from '../../services/chromeExtensionService'

const STATUS_CONFIGS = {
  QUEUED: {
    label: 'Queued',
    icon: Clock,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  RUNNING: {
    label: 'Running',
    icon: RotateCw,
    spin: true,
    style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-pulse',
  },
  PASSED: {
    label: 'Passed',
    icon: CheckCircle,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  PASS: {
    label: 'Passed',
    icon: CheckCircle,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  FAIL: {
    label: 'Failed',
    icon: XCircle,
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  ERROR: {
    label: 'Error',
    icon: AlertTriangle,
    style: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  },
}

export default function TestSuitesTab({
  workspaceId,
  extensionId,
  testCases = [],
  canManage = false,
}) {
  const queryClient = useQueryClient()

  const [suiteModalOpen, setSuiteModalOpen] = useState(false)
  const [editingSuite, setEditingSuite] = useState(null)
  const [deletingSuite, setDeletingSuite] = useState(null)

  const [activeRunModalOpen, setActiveRunModalOpen] = useState(false)
  const [activeRunSuiteId, setActiveRunSuiteId] = useState(null)
  const [activeRunId, setActiveRunId] = useState(null)

  // 1. Fetch Suites List
  const {
    data: suites = [],
    isLoading: isSuitesLoading,
  } = useQuery({
    queryKey: ['extension-test-suites', workspaceId, extensionId],
    queryFn: () => chromeExtensionService.listTestSuites(workspaceId, extensionId),
    enabled: Boolean(workspaceId && extensionId),
  })

  // 2. Fetch Recent Extension Runs (to track active runs & last run per suite)
  const { data: runsPage } = useQuery({
    queryKey: ['extension-test-runs', workspaceId, extensionId],
    queryFn: () => chromeExtensionService.listTestRuns(workspaceId, extensionId, { size: 20 }),
    enabled: Boolean(workspaceId && extensionId),
  })

  const runsList = runsPage?.content || (Array.isArray(runsPage) ? runsPage : [])

  // Check if ANY run for this extension is currently active (QUEUED/RUNNING/PENDING)
  const activeExtensionRun = runsList.find((r) =>
    ['QUEUED', 'RUNNING', 'PENDING'].includes(r.status)
  )

  // Delete Suite Mutation
  const deleteSuiteMutation = useMutation({
    mutationFn: (suiteId) => chromeExtensionService.deleteTestSuite(workspaceId, extensionId, suiteId),
    onSuccess: () => {
      toast.success('Test suite deleted')
      queryClient.invalidateQueries({ queryKey: ['extension-test-suites', workspaceId, extensionId] })
      setDeletingSuite(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete test suite')
    },
  })

  // Start Suite Run Mutation
  const startRunMutation = useMutation({
    mutationFn: (suiteId) => chromeExtensionService.startSuiteRun(workspaceId, extensionId, suiteId),
    onSuccess: (newRun, suiteId) => {
      toast.success('Test suite run started')
      setActiveRunSuiteId(suiteId)
      setActiveRunId(newRun.id)
      setActiveRunModalOpen(true)
      queryClient.invalidateQueries({ queryKey: ['extension-test-suites', workspaceId, extensionId] })
      queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start suite run')
    },
  })

  const handleOpenCreate = () => {
    setEditingSuite(null)
    setSuiteModalOpen(true)
  }

  const handleOpenEdit = (suite) => {
    setEditingSuite(suite)
    setSuiteModalOpen(true)
  }

  const handleRunSuite = (suite) => {
    if (!suite.enabled) {
      toast.error('Cannot run disabled suite')
      return
    }
    const enabledItemCount = (suite.items || []).filter(
      (item) => item.enabled !== false && item.testCase?.enabled !== false
    ).length

    if (enabledItemCount === 0 && (suite.totalItems || 0) === 0) {
      toast.error('Suite contains no test cases')
      return
    }

    if (activeExtensionRun) {
      toast.error(
        `A test run (#${activeExtensionRun.id}) is already in progress for this extension.`
      )
      return
    }

    startRunMutation.mutate(suite.id)
  }

  const handleViewLastRun = (suite) => {
    // Find latest run for this suite
    const suiteRun = runsList.find((r) => String(r.suiteId) === String(suite.id))
    if (suiteRun) {
      setActiveRunSuiteId(suite.id)
      setActiveRunId(suiteRun.id)
      setActiveRunModalOpen(true)
    } else {
      toast.error('No previous runs found for this suite')
    }
  }

  if (isSuitesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RotateCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading test suites...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-[#30363D]">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Test Suites
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {suites.length} total
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Group, sequence, and execute test cases with deterministic order and Stop-on-Failure policy.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus size={14} /> Add Test Suite
          </button>
        )}
      </div>

      {/* Active Run Banner (if extension execution is currently active) */}
      {activeExtensionRun && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <RotateCw size={15} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>
              <strong className="font-semibold">Run #{activeExtensionRun.id}</strong> in progress
              ({activeExtensionRun.status}). Duplicate suite execution is temporarily disabled.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveRunSuiteId(activeExtensionRun.suiteId || suites[0]?.id)
              setActiveRunId(activeExtensionRun.id)
              setActiveRunModalOpen(true)
            }}
            className="px-2.5 py-1 font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors self-end sm:self-auto"
          >
            View Active Run
          </button>
        </div>
      )}

      {/* Empty State */}
      {suites.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#161B22]/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
            <Layers size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            No test suites configured yet
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Group existing API and Browser test cases into executable test suites with custom ordering.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus size={14} /> Create First Test Suite
            </button>
          )}
        </div>
      ) : (
        /* Suite Cards List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suites.map((suite) => {
            const itemCount = suite.totalItems ?? (suite.items?.length || 0)
            const enabledItems = (suite.items || []).filter(
              (i) => i.enabled !== false && i.testCase?.enabled !== false
            ).length
            const lastRun = runsList.find((r) => String(r.suiteId) === String(suite.id))
            const lastRunStatusCfg = lastRun ? STATUS_CONFIGS[lastRun.status] || STATUS_CONFIGS.QUEUED : null
            const LastRunIcon = lastRunStatusCfg?.icon

            // Duplicate execution prevention flag
            const isRunDisabled =
              !suite.enabled ||
              startRunMutation.isPending ||
              Boolean(activeExtensionRun)

            return (
              <div
                key={suite.id}
                className="p-5 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-gray-300 dark:hover:border-gray-700"
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {suite.name}
                        </h3>

                        {suite.enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle size={11} /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            <XCircle size={11} /> Disabled
                          </span>
                        )}

                        {suite.stopOnFailure && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <ShieldCheck size={11} /> Stop on Failure
                          </span>
                        )}
                      </div>

                      {suite.description && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {suite.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      Items: <strong className="text-gray-900 dark:text-white font-mono">{itemCount}</strong>
                    </div>

                    <div>
                      Executable: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{enabledItems > 0 ? enabledItems : itemCount}</strong>
                    </div>

                    {lastRun && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-gray-700">
                        <span>Last Run:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border ${lastRunStatusCfg.style}`}
                        >
                          <LastRunIcon size={10} className={lastRunStatusCfg.spin ? 'animate-spin' : ''} />
                          {lastRunStatusCfg.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#21262D]">
                  <div className="flex items-center gap-1.5">
                    {lastRun && (
                      <button
                        type="button"
                        onClick={() => handleViewLastRun(suite)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                      >
                        View Last Run
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(suite)}
                          title="Edit Suite"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSuite(suite)}
                          title="Delete Suite"
                          className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      disabled={isRunDisabled}
                      onClick={() => handleRunSuite(suite)}
                      title={
                        activeExtensionRun
                          ? 'A run is currently in progress for this extension'
                          : !suite.enabled
                          ? 'Suite is disabled'
                          : 'Execute test suite'
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                    >
                      {startRunMutation.isPending && startRunMutation.variables === suite.id ? (
                        <>
                          <RotateCw size={14} className="animate-spin" /> Starting...
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} /> Run Suite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TestSuiteModal
        isOpen={suiteModalOpen}
        onClose={() => setSuiteModalOpen(false)}
        extensionId={extensionId}
        suite={editingSuite}
        testCases={testCases}
      />

      {/* Live Suite Run Inspector Modal */}
      <TestSuiteRunModal
        isOpen={activeRunModalOpen}
        onClose={() => setActiveRunModalOpen(false)}
        workspaceId={workspaceId}
        extensionId={extensionId}
        suiteId={activeRunSuiteId}
        runId={activeRunId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingSuite)}
        onClose={() => setDeletingSuite(null)}
        title="Delete Test Suite"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete test suite{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{deletingSuite?.name}"
            </span>
            ?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setDeletingSuite(null)}
              disabled={deleteSuiteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteSuiteMutation.mutate(deletingSuite.id)}
              disabled={deleteSuiteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleteSuiteMutation.isPending && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
