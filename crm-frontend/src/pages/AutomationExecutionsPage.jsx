import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, PlayCircle, Hourglass, ChevronRight, User, Filter } from 'lucide-react'
import { automationService } from '../services/automationService'

const STATUS_BADGES = {
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  RUNNING: {
    label: 'Running',
    icon: PlayCircle,
    style: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  WAITING: {
    label: 'Waiting',
    icon: Hourglass,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  FAILED: {
    label: 'Failed',
    icon: AlertTriangle,
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  },
}

export default function AutomationExecutionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [page, setPage] = useState(0)
  const pageSize = 20

  const automationQuery = useQuery({
    queryKey: ['automation', currentWorkspace?.id, id],
    queryFn: () => automationService.getAutomation(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  const executionsQuery = useQuery({
    queryKey: ['automation-executions', currentWorkspace?.id, id, page],
    queryFn: () =>
      automationService.getExecutions(currentWorkspace.id, id, {
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      }),
    enabled: !!currentWorkspace?.id && !!id,
  })

  const automation = automationQuery.data
  const executionsData = executionsQuery.data
  const executions = executionsData?.content || executionsData || []
  const totalPages = executionsData?.totalPages || 1

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0D1117] p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/marketing/automations/${id}/edit`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back to Builder
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Execution History: {automation?.name || `#${id}`}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor real-time workflow runs and execution progress for each lead.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/marketing/automations/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#21262D] hover:bg-gray-200 dark:hover:bg-[#30363D] rounded-xl transition-colors"
          >
            Edit Workflow
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm overflow-hidden">
        {executionsQuery.isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading executions...</p>
          </div>
        ) : executionsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Failed to load execution history.</p>
            <button
              type="button"
              onClick={() => executionsQuery.refetch()}
              className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-400 underline"
            >
              Try again
            </button>
          </div>
        ) : executions.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Executions Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              When triggered by events, workflow executions for leads will be logged here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#0D1117] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-[#30363D]">
                <tr>
                  <th className="py-3.5 px-6">Lead</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Current Step</th>
                  <th className="py-3.5 px-6">Started</th>
                  <th className="py-3.5 px-6">Completed</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#30363D]">
                {executions.map((exec) => {
                  const statusInfo = STATUS_BADGES[exec.status] || STATUS_BADGES.PENDING
                  const StatusIcon = statusInfo.icon
                  return (
                    <tr
                      key={exec.id}
                      onClick={() => navigate(`/marketing/automations/${id}/executions/${exec.id}`)}
                      className="hover:bg-gray-50/80 dark:hover:bg-[#21262D]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {exec.leadName || exec.leadEmail || `Lead #${exec.leadId}`}
                            </div>
                            {exec.leadEmail && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{exec.leadEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.style}`}
                        >
                          <StatusIcon size={13} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">
                        {exec.currentStep != null
                          ? `Step ${exec.currentStep} of ${exec.totalSteps || '-'}`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(exec.startedAt)}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(exec.completedAt)}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(exec.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <ChevronRight className="inline text-gray-400" size={18} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#30363D] bg-gray-50/50 dark:bg-[#0D1117]">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
