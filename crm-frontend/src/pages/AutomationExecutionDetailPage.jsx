import { useParams, useNavigate } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, User, Zap, Mail, ShieldAlert } from 'lucide-react'
import { automationService } from '../services/automationService'

export default function AutomationExecutionDetailPage() {
  const { id, executionId } = useParams()
  const navigate = useNavigate()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const { data: execution, isLoading, isError, refetch } = useQuery({
    queryKey: ['automation-execution-detail', currentWorkspace?.id, id, executionId],
    queryFn: () => automationService.getExecution(currentWorkspace.id, id, executionId),
    enabled: !!currentWorkspace?.id && !!id && !!executionId,
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50 dark:bg-[#0D1117]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    )
  }

  if (isError || !execution) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
          <h3 className="text-lg font-bold">Failed to load execution details</h3>
          <p className="text-sm mt-1 text-rose-600 dark:text-rose-300">
            The execution record might have been removed or is temporarily unavailable.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/marketing/automations/${id}/executions`)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              Back to Executions
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isFailed = execution.status === 'FAILED'
  const isCompleted = execution.status === 'COMPLETED'
  const stepsList = execution.steps || []

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0D1117] p-6 space-y-6">
      {/* Back button and Header */}
      <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm">
        <button
          type="button"
          onClick={() => navigate(`/marketing/automations/${id}/executions`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Back to Execution List
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Execution #{execution.id}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200'
                    : isFailed
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200'
                }`}
              >
                {execution.statusLabel || execution.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Automation: <span className="font-semibold text-gray-800 dark:text-gray-200">{execution.automationName || `#${id}`}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0D1117] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <span className="block font-medium text-gray-700 dark:text-gray-300">Started</span>
              {formatDate(execution.startedAt || execution.createdAt)}
            </div>
            <div>
              <span className="block font-medium text-gray-700 dark:text-gray-300">Completed</span>
              {formatDate(execution.completedAt)}
            </div>
            <div>
              <span className="block font-medium text-gray-700 dark:text-gray-300">Duration</span>
              {execution.duration || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Target Lead Info */}
      <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm flex items-center gap-4">
        <div className="p-3 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
          <User size={24} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Target Lead
          </h3>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {execution.leadName || execution.leadEmail || `Lead ID #${execution.leadId}`}
          </p>
          {execution.leadEmail && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{execution.leadEmail}</p>
          )}
        </div>
      </div>

      {/* Backend Error Banner (if execution failed) */}
      {isFailed && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-5 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" size={22} />
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Execution Failed</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono bg-rose-100/60 dark:bg-rose-900/40 p-2.5 rounded-lg border border-rose-200/50 dark:border-rose-800/50">
              {execution.error || 'Execution encountered an unexpected step failure.'}
            </p>
          </div>
        </div>
      )}

      {/* Visual Execution Timeline */}
      <div className="bg-white dark:bg-[#161B22] p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Step Execution Timeline
        </h3>

        {stepsList.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No execution step details recorded.</p>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
            {stepsList.map((step, index) => {
              const stepSuccess = step.status === 'COMPLETED'
              const stepFailed = step.status === 'FAILED'
              const stepWaiting = step.status === 'WAITING'

              return (
                <div key={step.stepId || index} className="relative flex items-start gap-4 group">
                  {/* Timeline Dot Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#161B22] ${
                      stepSuccess
                        ? 'bg-emerald-500 text-white'
                        : stepFailed
                        ? 'bg-rose-500 text-white'
                        : stepWaiting
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {stepSuccess ? (
                      <CheckCircle2 size={16} />
                    ) : stepFailed ? (
                      <XCircle size={16} />
                    ) : stepWaiting ? (
                      <Clock size={16} />
                    ) : (
                      <Zap size={14} />
                    )}
                  </div>

                  {/* Content Box */}
                  <div className="flex-1 bg-gray-50 dark:bg-[#0D1117] p-4 rounded-xl border border-gray-200 dark:border-[#30363D]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400">Step {step.stepOrder || index + 1}</span>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            {step.stepTypeLabel || step.stepType}
                          </h4>
                        </div>
                        {step.executedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Executed at: {formatDate(step.executedAt)}
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-self-start px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stepSuccess
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : stepFailed
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {step.statusLabel || step.status}
                      </span>
                    </div>

                    {/* Step Failure Reason */}
                    {stepFailed && step.error && (
                      <div className="mt-3 p-3 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 font-mono">
                        ✕ Reason: {step.error}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
