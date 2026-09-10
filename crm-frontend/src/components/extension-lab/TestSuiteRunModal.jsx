import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  Calendar,
  Layers,
  AlertCircle,
  Code,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
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
  SKIPPED: {
    label: 'Skipped',
    icon: Clock,
    style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
}

export default function TestSuiteRunModal({
  isOpen,
  onClose,
  workspaceId,
  extensionId,
  suiteId,
  runId,
  onRunUpdated,
}) {
  const queryClient = useQueryClient()
  const [expandedResultId, setExpandedResultId] = useState(null)
  const [showLogs, setShowLogs] = useState(false)
  const [copiedLogs, setCopiedLogs] = useState(false)
  const pollCountRef = useRef(0)

  // Reset poll count when modal opens or runId changes
  useEffect(() => {
    if (isOpen) {
      pollCountRef.current = 0
    }
  }, [isOpen, runId])

  // Fetch Suite Run Details with Clean Polling Lifecycle
  const {
    data: run,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['extension-suite-run', workspaceId, extensionId, suiteId, runId],
    queryFn: () => chromeExtensionService.getSuiteRun(workspaceId, extensionId, suiteId, runId),
    enabled: Boolean(isOpen && workspaceId && extensionId && suiteId && runId),
    refetchInterval: (query) => {
      if (!isOpen) return false
      const status = query.state.data?.status
      const isTerminal = ['PASSED', 'FAILED', 'ERROR', 'CANCELLED'].includes(status)
      if (!isTerminal && pollCountRef.current < 80) {
        pollCountRef.current += 1
        return 1500 // Poll every 1.5 seconds
      }
      return false // Stop polling immediately on terminal state or max polls
    },
  })

  // Notify parent on status update
  useEffect(() => {
    if (run?.status && onRunUpdated) {
      onRunUpdated(run)
    }
  }, [run, onRunUpdated])

  // Cancel Run Mutation
  const cancelMutation = useMutation({
    mutationFn: () => chromeExtensionService.cancelSuiteRun(workspaceId, extensionId, suiteId, runId),
    onSuccess: (updatedRun) => {
      toast.success('Suite run cancellation requested')
      queryClient.setQueryData(
        ['extension-suite-run', workspaceId, extensionId, suiteId, runId],
        updatedRun
      )
      queryClient.invalidateQueries({ queryKey: ['extension-test-suites', workspaceId, extensionId] })
      refetch()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel suite run')
    },
  })

  // Reliable Stop-on-Failure evidence check (MUST NOT infer from generic FAILED+SKIPPED counts)
  const hasStopOnFailureEvidence = Boolean(
    run &&
      run.skippedTests > 0 &&
      (run.results?.some((r) => {
        const err = r.errorMessage || ''
        const asstMsg = r.assertionDetails?.message || ''
        return err.includes('stopOnFailure') || asstMsg.includes('stopOnFailure')
      }) ||
        run.logs?.includes('SUITE_ITEM_SKIPPED') ||
        run.logs?.includes('stopOnFailure policy'))
  )

  const handleCopyLogs = () => {
    if (run?.logs) {
      navigator.clipboard.writeText(run.logs)
      setCopiedLogs(true)
      toast.success('Logs copied to clipboard')
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

  const isExecuting =
    run?.status === 'QUEUED' || run?.status === 'RUNNING' || run?.status === 'PENDING'

  const statusCfg = STATUS_CONFIGS[run?.status] || STATUS_CONFIGS.QUEUED
  const StatusIcon = statusCfg.icon

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={run ? `Test Suite Run #${run.id}` : 'Suite Run Execution'}
      size="xl"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RotateCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Loading suite execution details...
          </p>
        </div>
      ) : isError || !run ? (
        <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900">
          <AlertCircle size={24} className="mx-auto mb-2" />
          Failed to load suite run details. Please check connection and try again.
        </div>
      ) : (
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header & Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  Suite: {run.suiteName || `Suite #${run.suiteId}`}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.style}`}
                >
                  <StatusIcon size={14} className={statusCfg.spin ? 'animate-spin' : ''} />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Triggered by {run.triggeredByName || 'System'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isExecuting && (
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  {cancelMutation.isPending ? (
                    <RotateCw size={13} className="animate-spin" />
                  ) : (
                    <Ban size={13} />
                  )}
                  <span>Cancel Run</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => refetch()}
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                title="Refresh Status"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          {/* Aggregated Metrics Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D]">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Total Tests
              </span>
              <div className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {run.totalTests ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Passed
              </span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {run.passedTests ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                Failed
              </span>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {run.failedTests ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
              <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400">
                Errors
              </span>
              <div className="text-base font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                {run.errorTests ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-400">
                Skipped
              </span>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                {run.skippedTests ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400">
                Duration
              </span>
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {run.durationMs != null ? (run.durationMs >= 1000 ? `${(run.durationMs / 1000).toFixed(1)}s` : `${run.durationMs}ms`) : 'In progress...'}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400 px-1">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span>Started: {formatTimestamp(run.startedAt || run.createdAt)}</span>
            </div>
            {run.completedAt && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>Completed: {formatTimestamp(run.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Reliable Stop-on-Failure Alert Banner */}
          {hasStopOnFailureEvidence && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Execution Halted Early (Stop-on-Failure):</span>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                  This suite execution stopped following a test failure because the Stop-on-Failure policy was enabled. Remaining enabled test cases were marked as SKIPPED by the backend.
                </p>
              </div>
            </div>
          )}

          {/* Per-Test Results Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Individual Test Case Results ({run.results?.length || 0})
            </h4>

            {!run.results || run.results.length === 0 ? (
              <div className="p-6 rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-center text-xs text-gray-500 dark:text-gray-400">
                {isExecuting
                  ? 'Suite execution in progress... Results will appear here live.'
                  : 'No test results recorded for this suite run.'}
              </div>
            ) : (
              <div className="space-y-2">
                {run.results.map((res, index) => {
                  const resStatusCfg = STATUS_CONFIGS[res.status] || STATUS_CONFIGS.PASSED
                  const ResIcon = resStatusCfg.icon
                  const isExpanded = expandedResultId === res.id

                  return (
                    <div
                      key={res.id || index}
                      className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] overflow-hidden transition-all text-xs"
                    >
                      {/* Item Row Header */}
                      <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors mt-0.5 sm:mt-0"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>

                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            #{index + 1}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${resStatusCfg.style}`}
                          >
                            <ResIcon size={12} />
                            {resStatusCfg.label}
                          </span>

                          <span className="font-semibold text-gray-900 dark:text-white">
                            {res.testCaseName || `Test Case #${res.testCaseId}`}
                          </span>

                          {res.requestMethod && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {res.requestMethod}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 text-gray-500 dark:text-gray-400">
                          {res.actualStatusCode != null && (
                            <span className="font-mono">
                              HTTP{' '}
                              <span
                                className={
                                  res.actualStatusCode >= 200 && res.actualStatusCode < 300
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-rose-600 dark:text-rose-400 font-bold'
                                }
                              >
                                {res.actualStatusCode}
                              </span>
                            </span>
                          )}

                          <span className="font-mono">
                            {res.executionTimeMs != null ? `${res.executionTimeMs}ms` : '-'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                            className="px-2 py-1 font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </div>
                      </div>

                      {/* Error Message Snippet */}
                      {res.errorMessage && !isExpanded && (
                        <div className="px-3.5 pb-3 pt-0 text-rose-600 dark:text-rose-400 text-xs font-medium pl-10">
                          {res.errorMessage}
                        </div>
                      )}

                      {/* Expandable Inspection Details */}
                      {isExpanded && (
                        <div className="p-4 bg-gray-50/75 dark:bg-[#0D1117]/60 border-t border-gray-200 dark:border-[#30363D] space-y-3.5">
                          {/* Error Message */}
                          {res.errorMessage && (
                            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 font-medium">
                              <span className="font-bold">Error Message:</span> {res.errorMessage}
                            </div>
                          )}

                          {/* Playwright Step Results (for BROWSER tests) */}
                          {res.assertionDetails?.stepResults &&
                            Array.isArray(res.assertionDetails.stepResults) && (
                              <div className="space-y-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  Playwright Step Execution ({res.assertionDetails.stepResults.length} steps):
                                </span>
                                <div className="space-y-1.5">
                                  {res.assertionDetails.stepResults.map((step, sIdx) => {
                                    const isStepPass = step.status === 'PASSED'
                                    const filename =
                                      step.expected ||
                                      (step.artifactPath ? step.artifactPath.split('/').pop() : null)
                                    const artifactEndpoint = filename
                                      ? `/api/workspaces/${workspaceId}/chrome-extensions/${extensionId}/browser-runs/${run.id}/artifacts/${filename}`
                                      : null

                                    return (
                                      <div
                                        key={sIdx}
                                        className={`p-2.5 rounded-lg border ${
                                          isStepPass
                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            {isStepPass ? (
                                              <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                            ) : (
                                              <XCircle size={13} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                            )}
                                            <span className="font-mono text-[11px] font-bold">
                                              Step #{step.order ?? sIdx} {step.action}
                                            </span>
                                            {step.target && (
                                              <span className="font-mono text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
                                                {step.target}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] font-mono text-gray-500">
                                            {step.durationMs != null ? `${step.durationMs}ms` : ''}
                                          </span>
                                        </div>

                                        {(step.expected != null || step.actual != null) &&
                                          step.action !== 'SCREENSHOT' && (
                                            <div className="mt-1 pl-5 font-mono text-[10px] text-gray-600 dark:text-gray-400">
                                              Expected: {JSON.stringify(step.expected)} | Actual:{' '}
                                              {JSON.stringify(step.actual)}
                                            </div>
                                          )}

                                        {step.action === 'SCREENSHOT' && artifactEndpoint && (
                                          <div className="mt-1.5 pl-5">
                                            <a
                                              href={artifactEndpoint}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                                            >
                                              View Captured Screenshot ({filename}) &rarr;
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                          {/* Assertions Evaluation Breakdown */}
                          {(!res.assertionDetails?.stepResults ||
                            res.assertionDetails.stepResults.length === 0) &&
                            res.assertionDetails?.assertions &&
                            Array.isArray(res.assertionDetails.assertions) && (
                              <div className="space-y-1.5">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  Assertion Evaluations:
                                </span>
                                {res.assertionDetails.assertions.map((asst, aIdx) => (
                                  <div
                                    key={aIdx}
                                    className={`p-2 rounded-lg border flex items-start gap-2 ${
                                      asst.passed
                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                                    }`}
                                  >
                                    {asst.passed ? (
                                      <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle size={13} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                      <div className="font-medium text-[11px]">{asst.message}</div>
                                      <div className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                                        Expected: {JSON.stringify(asst.expected)} | Actual:{' '}
                                        {JSON.stringify(asst.actual)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Request & Response Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                                Request Details:
                              </span>
                              <pre className="p-2.5 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-[11px] text-gray-800 dark:text-gray-200 overflow-x-auto max-h-40">
                                {JSON.stringify(res.assertionDetails?.request || {}, null, 2)}
                              </pre>
                            </div>

                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                                Actual Response Payload:
                              </span>
                              <pre className="p-2.5 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-[11px] text-gray-800 dark:text-gray-200 overflow-x-auto max-h-40">
                                {JSON.stringify(
                                  res.actualResponsePayload ||
                                    res.assertionDetails?.actual?.payload ||
                                    {},
                                  null,
                                  2
                                )}
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

          {/* Execution Logs Section */}
          {run.logs && (
            <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] overflow-hidden">
              <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-[#30363D] bg-gray-50/50 dark:bg-[#0D1117]/50">
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white"
                >
                  <Terminal size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Execution Logs</span>
                  {showLogs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-gray-200 dark:border-[#30363D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D]"
                >
                  {copiedLogs ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {showLogs && (
                <pre className="p-3.5 bg-[#0D1117] text-gray-200 font-mono text-xs overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">
                  {run.logs}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
