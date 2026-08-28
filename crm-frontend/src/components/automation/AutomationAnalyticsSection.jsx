import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { BarChart3, CheckCircle2, XCircle, Clock, Percent, Mail, Send, Eye, MousePointerClick } from 'lucide-react'
import { automationService } from '../../services/automationService'

export default function AutomationAnalyticsSection({ automationId }) {
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const { data: metrics, isLoading, isError, refetch } = useQuery({
    queryKey: ['automation-metrics', currentWorkspace?.id, automationId],
    queryFn: () => automationService.getExecutionMetrics(currentWorkspace.id, automationId),
    enabled: !!currentWorkspace?.id && !!automationId,
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-sm flex items-center justify-between">
          <span>Failed to load execution analytics.</span>
          <button type="button" onClick={() => refetch()} className="font-semibold underline hover:no-underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Extract metrics from API response DTO
  const totalExecutions = metrics?.totalExecutions ?? 0
  const completedExecutions = metrics?.completedExecutions ?? 0
  const failedExecutions = metrics?.failedExecutions ?? 0
  const waitingExecutions = metrics?.waitingExecutions ?? 0
  const successRate = metrics?.successRate != null ? `${metrics.successRate.toFixed(1)}%` : '0%'
  const avgDuration = metrics?.averageDurationSeconds != null ? `${metrics.averageDurationSeconds}s` : 'N/A'

  // Metric definitions matching prompt requirements exactly
  const primaryMetrics = [
    {
      title: 'Total Executions',
      value: totalExecutions.toLocaleString(),
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      title: 'Completed',
      value: completedExecutions.toLocaleString(),
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    {
      title: 'Failed',
      value: failedExecutions.toLocaleString(),
      icon: XCircle,
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    },
    {
      title: 'Success Rate',
      value: successRate,
      icon: Percent,
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    {
      title: 'Waiting Executions',
      value: waitingExecutions.toLocaleString(),
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
    {
      title: 'Avg. Duration',
      value: avgDuration,
      icon: Clock,
      color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
  ]

  // Email stats requested: Emails Sent, Delivered, Opened, Clicked
  // If backend execution metrics DTO does not return these sub-stats directly, explicitly display "Not available yet"
  const emailMetrics = [
    {
      title: 'Emails Sent',
      value: metrics?.emailsSent != null ? metrics.emailsSent.toLocaleString() : 'Not available yet',
      icon: Mail,
    },
    {
      title: 'Delivered',
      value: metrics?.emailsDelivered != null ? metrics.emailsDelivered.toLocaleString() : 'Not available yet',
      icon: Send,
    },
    {
      title: 'Opened',
      value: metrics?.emailsOpened != null ? metrics.emailsOpened.toLocaleString() : 'Not available yet',
      icon: Eye,
    },
    {
      title: 'Clicked',
      value: metrics?.emailsClicked != null ? metrics.emailsClicked.toLocaleString() : 'Not available yet',
      icon: MousePointerClick,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automation Performance Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Real-time metrics calculated directly from execution logs.
        </p>
      </div>

      {/* Execution Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {primaryMetrics.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${item.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Email Engagement Section */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-[#30363D] p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Email Engagement Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {emailMetrics.map((item) => {
            const Icon = item.icon
            const isNotAvailable = item.value === 'Not available yet'
            return (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                  <Icon size={16} />
                  <span className="text-xs font-medium uppercase">{item.title}</span>
                </div>
                <p
                  className={`text-lg font-bold ${
                    isNotAvailable
                      ? 'text-gray-400 dark:text-gray-500 text-sm italic font-normal'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
