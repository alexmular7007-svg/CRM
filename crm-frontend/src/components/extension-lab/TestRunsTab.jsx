import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Terminal,
  Copy,
  Check,
  Code,
  Calendar,
  Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chromeExtensionService } from '../../services/chromeExtensionService'

const STATUS_CONFIGS = {
  QUEUED: {
    label: 'Queued',
    icon: Clock,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  RUNNING: {
    label: 'Running',
    icon: RotateCw,
    spin: true,
    style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-pulse',
    dot: 'bg-indigo-500',
  },
  PASSED: {
    label: 'Passed',
    icon: CheckCircle,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  PASS: {
    label: 'Passed',
    icon: CheckCircle,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  FAIL: {
    label: 'Failed',
    icon: XCircle,
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  ERROR: {
    label: 'Error',
    icon: AlertTriangle,
    style: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
    dot: 'bg-gray-400',
  },
}

export default function TestRunsTab({
  workspaceId,
  extensionId,
  testCases = [],
}) {
  const queryClient = useQueryClient()
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [expandedResultId, setExpandedResultId] = useState(null)
  const [showLogs, setShowLogs] = useState(true)
  const [copiedLogs, setCopiedLogs] = useState(false)
  const pollCountRef = useRef(0)

  // 1. Fetch Runs History List
  const {
    data: runsPage,
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['extension-test-runs', workspaceId, extensionId],
    queryFn: () => chromeExtensionService.listTestRuns(workspaceId, extensionId, { size: 20 }),
    enabled: !!workspaceId && !!extensionId,
  })

  const runsList = runsPage?.content || (Array.isArray(runsPage) ? runsPage : [])

  // Auto-select the latest run if none is selected
  useEffect(() => {
    if (!selectedRunId && runsList.length > 0) {
      setSelectedRunId(runsList[0].id)
    }
  }, [runsList, selectedRunId])

  // 2. Fetch Selected Run Details with Polling
  const {
    data: activeRun,
    isLoading: isRunLoading,
  } = useQuery({
    queryKey: ['extension-test-run', workspaceId, extensionId, selectedRunId],
    queryFn: () => chromeExtensionService.getTestRun(workspaceId, extensionId, selectedRunId),
    enabled: !!workspaceId && !!extensionId && !!selectedRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      const isTerminal = ['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(status)
      if (!isTerminal && pollCountRef.current < 60) {
        pollCountRef.current += 1
        return 1200
      }
      return false
    },
  })

  // Whenever status reaches terminal, refresh history list
  useEffect(() => {
    if (activeRun?.status && ['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(activeRun.status)) {
      queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })
    }
  }, [activeRun?.status, queryClient, workspaceId, extensionId])

  // 3. Create / Trigger Run Mutation
  const createRunMutation = useMutation({
    mutationFn: () => chromeExtensionService.createTestRun(workspaceId, extensionId),
    onSuccess: (newRun) => {
      pollCountRef.current = 0
      setSelectedRunId(newRun.id)
      queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })
      queryClient.setQueryData(['extension-test-run', workspaceId, extensionId, newRun.id], newRun)
      toast.success('Test run started')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start test run')
    },
  })

  // 4. Cancel Run Mutation
  const cancelRunMutation = useMutation({
    mutationFn: (runId) => chromeExtensionService.cancelTestRun(workspaceId, extensionId, runId),
    onSuccess: (updatedRun) => {
      queryClient.setQueryData(['extension-test-run', workspaceId, extensionId, updatedRun.id], updatedRun)
      queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })
      toast.success('Test run cancelled')
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to cancel test run')
    },
  })

  // 5. Create Browser Run Mutation (Phase 6B - Playwright)
  const createBrowserRunMutation = useMutation({
    mutationFn: () => chromeExtensionService.startBrowserTestRun(workspaceId, extensionId),
    onSuccess: (newRun) => {
      pollCountRef.current = 0
      setSelectedRunId(newRun.runId)
      queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })
      toast.success('Browser automation test started (Playwright + Chromium)')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start browser test run')
    },
  })

  const isBrowserExecuting = createBrowserRunMutation.isPending

  const isExecuting =
    createRunMutation.isPending ||
    activeRun?.status === 'QUEUED' ||
    activeRun?.status === 'RUNNING' ||
    activeRun?.status === 'PENDING'

  const enabledCount = testCases.filter((tc) => tc.enabled !== false).length

  const handleCopyLogs = () => {
    if (activeRun?.logs) {
      navigator.clipboard.writeText(activeRun.logs)
      setCopiedLogs(true)
      toast.success('Execution logs copied to clipboard')
      setTimeout(() => setCopiedLogs(false), 2000)
    }
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const activeStatusCfg = STATUS_CONFIGS[activeRun?.status] || STATUS_CONFIGS.QUEUED
  const ActiveStatusIcon = activeStatusCfg.icon

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Test Execution Engine
            {isExecuting && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Run automated HTTP CRUD test cases against the CRM backend API with real assertions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isExecuting && activeRun?.status !== 'QUEUED' && (
            <button
              type="button"
              onClick={() => cancelRunMutation.mutate(activeRun?.id)}
              disabled={cancelRunMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Ban size={14} /> Cancel Run
            </button>
          )}

          <button
            type="button"
            onClick={() => createBrowserRunMutation.mutate()}
            disabled={isExecuting || isBrowserExecuting}
            title="Execute real Chromium + Playwright browser smoke tests against the unpacked extension"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
          >
            {isBrowserExecuting ? (
              <>
                <RotateCw size={15} className="animate-spin" />
                <span>Starting Browser...</span>
              </>
            ) : (
              <>
                <PlayCircle size={15} />
                <span>Run Browser Tests (Playwright)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => createRunMutation.mutate()}
            disabled={isExecuting || isBrowserExecuting || enabledCount === 0}
            title={enabledCount === 0 ? 'Enable at least one test case to run suite' : 'Run all enabled test cases'}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
          >
            {isExecuting && !isBrowserExecuting ? (
              <>
                <RotateCw size={15} className="animate-spin" />
                <span>Executing Suite...</span>
              </>
            ) : (
              <>
                <PlayCircle size={15} />
                <span>Run Test Suite ({enabledCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* No Runs State */}
      {runsList.length === 0 && !isExecuting && (
        <div className="p-8 rounded-2xl border border-dashed border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#161B22]/50 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Layers size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            No test runs yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {enabledCount > 0
              ? `You have ${enabledCount} enabled test case${enabledCount === 1 ? '' : 's'}. Click 'Run Suite' to execute and capture live pass/fail telemetry.`
              : 'Add and enable test cases in the Test Cases tab to execute automated verification.'}
          </p>
          {enabledCount > 0 && (
            <button
              type="button"
              onClick={() => createRunMutation.mutate()}
              disabled={createRunMutation.isPending}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
            >
              <PlayCircle size={14} /> Run Suite
            </button>
          )}
        </div>
      )}

      {/* Active / Selected Run View */}
      {activeRun && (
        <div className="space-y-6">
          {/* Metrics Summary Card */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-[#21262D]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  Run #{activeRun.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${activeStatusCfg.style}`}
                >
                  <ActiveStatusIcon size={14} className={activeStatusCfg.spin ? 'animate-spin' : ''} />
                  {activeStatusCfg.label}
                </span>
                {activeRun.environment && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">
                    [{activeRun.environment}]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>{formatTimestamp(activeRun.startedAt || activeRun.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                  <Clock size={13} />
                  <span>{activeRun.durationMs != null ? `${activeRun.durationMs}ms` : 'In progress...'}</span>
                </div>
              </div>
            </div>

            {/* Metric Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-100 dark:border-[#21262D]">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Tests</span>
                <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {activeRun.totalTests || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Passed</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {activeRun.passedTests || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">Failed</span>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {activeRun.failedTests || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400">Errors</span>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                  {activeRun.errorTests || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400">Duration</span>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {activeRun.durationMs != null ? `${activeRun.durationMs}ms` : '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Test Results Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span>Test Results ({activeRun.results?.length || 0})</span>
              {isRunLoading && (
                <span className="text-xs text-gray-400 font-normal flex items-center gap-1">
                  <RotateCw size={12} className="animate-spin" /> Fetching updates...
                </span>
              )}
            </h3>

            {(!activeRun.results || activeRun.results.length === 0) ? (
              <div className="p-6 rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-center text-xs text-gray-500 dark:text-gray-400">
                {isExecuting ? 'Test execution in progress... Results will appear here live.' : 'No results recorded for this test run.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeRun.results.map((res) => {
                  const resStatusCfg = STATUS_CONFIGS[res.status] || STATUS_CONFIGS.PASSED
                  const ResIcon = resStatusCfg.icon
                  const isExpanded = expandedResultId === res.id

                  return (
                    <div
                      key={res.id}
                      className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm overflow-hidden transition-all"
                    >
                      {/* Result Item Header */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors mt-0.5 sm:mt-0"
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${resStatusCfg.style}`}
                              >
                                <ResIcon size={12} />
                                {resStatusCfg.label}
                              </span>

                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {res.testCaseName || `Test Case #${res.testCaseId}`}
                              </h4>

                              {res.requestMethod && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                  {res.requestMethod}
                                </span>
                              )}

                              {res.requestUrl && (
                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {res.requestUrl}
                                </span>
                              )}
                            </div>

                            {res.errorMessage && (
                              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                {res.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#21262D] text-xs text-gray-500 dark:text-gray-400">
                          {res.actualStatusCode != null && (
                            <div className="flex items-center gap-1 font-mono">
                              <span>Status:</span>
                              <span
                                className={`font-semibold ${
                                  res.actualStatusCode >= 200 && res.actualStatusCode < 300
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {res.actualStatusCode}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{res.executionTimeMs != null ? `${res.executionTimeMs}ms` : '-'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                            className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Result Breakdown */}
                      {isExpanded && (
                        <div className="p-4 bg-gray-50/75 dark:bg-[#0D1117]/60 border-t border-gray-200 dark:border-[#30363D] space-y-4 text-xs">
                          {/* Playwright Step Results Breakdown (Phase 6C) */}
                          {res.assertionDetails?.stepResults && Array.isArray(res.assertionDetails.stepResults) && (
                            <div className="space-y-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Playwright Step Execution ({res.assertionDetails.stepResults.length} steps):
                              </span>
                              <div className="space-y-2">
                                {res.assertionDetails.stepResults.map((step, sIdx) => {
                                  const isStepPass = step.status === 'PASSED'
                                  const filename = step.expected || (step.artifactPath ? step.artifactPath.split('/').pop() : null)
                                  const artifactEndpoint = filename
                                    ? `/api/workspaces/${workspaceId}/chrome-extensions/${extensionId}/browser-runs/${activeRun.id}/artifacts/${filename}`
                                    : null

                                  return (
                                    <div
                                      key={sIdx}
                                      className={`p-3 rounded-xl border ${
                                        isStepPass
                                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-gray-800 dark:text-gray-200'
                                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-gray-800 dark:text-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          {isStepPass ? (
                                            <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                          ) : (
                                            <XCircle size={14} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                          )}
                                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                            Step #{step.order ?? sIdx} {step.action}
                                          </span>
                                          {step.target && (
                                            <span className="font-mono text-[11px] text-gray-600 dark:text-gray-400 truncate max-w-xs sm:max-w-md">
                                              {step.target}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">
                                          {step.durationMs != null ? `${step.durationMs}ms` : ''}
                                        </span>
                                      </div>

                                      {(step.expected != null || step.actual != null) && step.action !== 'SCREENSHOT' && (
                                        <div className="mt-1.5 pl-5 font-mono text-[10px] text-gray-600 dark:text-gray-400">
                                          Expected: <span className="font-semibold">{JSON.stringify(step.expected)}</span> | Actual: <span className="font-semibold">{JSON.stringify(step.actual)}</span>
                                        </div>
                                      )}

                                      {step.error && (
                                        <div className="mt-1.5 pl-5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                                          {step.error}
                                        </div>
                                      )}

                                      {step.action === 'SCREENSHOT' && artifactEndpoint && (
                                        <div className="mt-2 pl-5">
                                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] inline-block">
                                            <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                              Screenshot Artifact: {filename}
                                            </div>
                                            <a
                                              href={artifactEndpoint}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                                            >
                                              View Captured Screenshot (PNG) &rarr;
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Assertion Details Breakdown (for non-browser test runs) */}
                          {(!res.assertionDetails?.stepResults || res.assertionDetails.stepResults.length === 0) &&
                            res.assertionDetails?.assertions && Array.isArray(res.assertionDetails.assertions) && (
                            <div className="space-y-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                Assertion Evaluations:
                              </span>
                              <div className="space-y-1.5">
                                {res.assertionDetails.assertions.map((asst, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                                      asst.passed
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-300'
                                    }`}
                                  >
                                    {asst.passed ? (
                                      <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle size={14} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5">
                                      <div className="font-medium text-[11px]">{asst.message}</div>
                                      <div className="font-mono text-[10px] text-gray-600 dark:text-gray-400">
                                        Expected: {JSON.stringify(asst.expected)} | Actual: {JSON.stringify(asst.actual)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Request and Response Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Request Info */}
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                                Request Details:
                              </span>
                              <pre className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-48 text-[11px]">
                                {JSON.stringify(res.assertionDetails?.request || {}, null, 2)}
                              </pre>
                            </div>

                            {/* Response Payload */}
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                                Actual Response Payload:
                              </span>
                              <pre className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-48 text-[11px]">
                                {JSON.stringify(res.actualResponsePayload || res.assertionDetails?.actual?.payload || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Execution Logs Terminal */}
          {activeRun.logs && (
            <div className="rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-[#30363D] bg-gray-50/50 dark:bg-[#0D1117]/50">
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white"
                >
                  <Terminal size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Execution Logs</span>
                  {showLogs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-[#30363D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D]"
                >
                  {copiedLogs ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLogs ? 'Copied' : 'Copy Logs'}</span>
                </button>
              </div>

              {showLogs && (
                <pre className="p-4 bg-[#0D1117] text-gray-200 font-mono text-xs overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
                  {activeRun.logs}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Test Run History Section */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Run History
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              ({runsList.length} total)
            </span>
          </h3>

          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['extension-test-runs', workspaceId, extensionId] })}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            title="Refresh history"
          >
            <RotateCw size={14} className={isHistoryLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {runsList.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
            No previous test runs found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#0D1117] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#30363D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Run</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold text-center">Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Passed</th>
                  <th className="py-3 px-4 font-semibold text-center">Failed</th>
                  <th className="py-3 px-4 font-semibold text-center">Errors</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#21262D]">
                {runsList.map((run) => {
                  const statusCfg = STATUS_CONFIGS[run.status] || STATUS_CONFIGS.QUEUED
                  const StatusIcon = statusCfg.icon
                  const isSelected = selectedRunId === run.id

                  return (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-[#21262D]/50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                        #{run.id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.style}`}
                        >
                          <StatusIcon size={11} className={statusCfg.spin ? 'animate-spin' : ''} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatTimestamp(run.startedAt || run.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                        {run.totalTests || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                        {run.passedTests || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">
                        {run.failedTests || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-orange-600 dark:text-orange-400">
                        {run.errorTests || 0}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">
                        {run.durationMs != null ? `${run.durationMs}ms` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRunId(run.id)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                          }`}
                        >
                          {isSelected ? 'Viewing' : 'View'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
