import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { memo, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import { useSelector, shallowEqual } from 'react-redux'
import Spinner from '../components/common/Spinner'
import { FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi'
import { format } from 'date-fns'
import { useThemeContext } from '../contexts/ThemeContext'
import { perfMonitor } from '../utils/performanceMonitor'

// Skeleton Loader Component
const StatsSkeleton = memo(() => (
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="card p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
))

// Memoized Stats Card with deep comparison
const StatCard = memo(({ stat, index, c }) => (
  <div key={index} className="card p-3 sm:p-5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="min-w-0">
        <p style={{ color: c.textSecondary }} className="text-xs sm:text-sm mb-0.5 sm:mb-1">
          {stat.label}
        </p>
        <p style={{ color: c.textPrimary }} className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
      </div>
      <div style={{ backgroundColor: stat.bgColor }} className="p-2 sm:p-3 rounded-lg w-fit">
        <stat.icon style={{ color: stat.color }} className="text-lg sm:text-2xl" />
      </div>
    </div>
  </div>
), (prev, next) => {
  return prev.stat.value === next.stat.value && prev.stat.label === next.stat.label && prev.index === next.index
})

// Memoized Recent Activity
const RecentActivitySkeleton = memo(() => (
  <div className="space-y-3 sm:space-y-4 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 mt-0.5"></div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    ))}
  </div>
))

// Memoized Activity Item
const ActivityItem = memo(({ activity, index, lastIndex, c }) => (
  <div key={activity.id || index} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3" style={{ borderBottomColor: c.border, borderBottomWidth: index < lastIndex ? 1 : 0 }}>
    <div style={{ 
      backgroundColor: activity.type === 'TASK' ? c.badgeInfo : c.badgeWarning,
      color: activity.type === 'TASK' ? c.badgeInfoText : c.badgeWarningText
    }} className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
      {activity.type}
    </div>
    <div className="flex-1 min-w-0">
      <p style={{ color: c.textPrimary }} className="text-xs sm:text-sm font-medium truncate">
        {activity.title}
      </p>
      <p style={{ color: c.textMuted }} className="text-xs mt-0.5 line-clamp-2">
        {activity.description}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-1.5 sm:mt-2 text-xs">
        <span style={{ color: c.textMuted }} className="truncate">
          {activity.createdBy}
        </span>
        <span style={{ color: c.textMuted }} className="flex-shrink-0">
          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
        </span>
      </div>
    </div>
  </div>
), (prev, next) => {
  return prev.activity.id === next.activity.id && prev.index === next.index
})

const Dashboard = memo(() => {
  const { currentTheme } = useThemeContext()
  const c = currentTheme?.colors || {}

  const currentWorkspace = useSelector(
    (state) => state.workspace.currentWorkspace,
    shallowEqual
  )

  // Track when dashboard component mounts
  useEffect(() => {
    perfMonitor.mark('dashboard_component_mounted')
  }, [])

  // Log currentWorkspace changes
  useEffect(() => {
    // currentWorkspace updated, queries will re-run automatically via queryKey dependency
  }, [currentWorkspace])

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) {
        return Promise.resolve(null)
      }
      perfMonitor.mark('dashboard_api_request_start')
      return analyticsService.getDashboard(currentWorkspace.id)
        .then(data => {
          perfMonitor.mark('dashboard_api_request_complete')
          return data
        })
        .catch(err => {
          perfMonitor.mark('dashboard_api_request_error')
          throw err
        })
    },
    enabled: !!currentWorkspace?.id,
    retry: 1,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

  // Load recent activities - parallel with dashboard
  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recentActivities', currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) return Promise.resolve([])
      perfMonitor.mark('activities_api_request_start')
      return analyticsService.getRecentActivities(currentWorkspace.id, 10)
        .then(data => {
          perfMonitor.mark('activities_api_request_complete')
          return data
        })
        .catch(err => {
          console.error('Activities API error:', err)
          perfMonitor.mark('activities_api_request_error')
          return []
        })
    },
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: keepPreviousData,  // ✅ Show previous activities while refetching
  })

  // Track when dashboard renders with data
  useEffect(() => {
    if (dashboardData && !isLoading) {
      perfMonitor.mark('dashboard_data_rendered')
    }
  }, [dashboardData, isLoading])

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p style={{ color: c.textMuted }} className="text-sm">
            No workspace selected. Please create or select a workspace.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p style={{ color: c.danger }} className="text-sm">
            Failed to load dashboard: {error.message || 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  // Build stats array - only if we have theme colors
  const stats = (c.info && c.success && c.warning && c.danger) ? [
    {
      label: 'Total Tasks',
      value: dashboardData?.taskStatistics?.totalTasks ?? 0,
      icon: FiCheckCircle,
      color: c.info,
      bgColor: c.badgeInfo,
    },
    {
      label: 'Completed',
      value: dashboardData?.taskStatistics?.completedTasks ?? 0,
      icon: FiCheckCircle,
      color: c.success,
      bgColor: c.badgeSuccess,
    },
    {
      label: 'In Progress',
      value: dashboardData?.taskStatistics?.inProgressTasks ?? 0,
      icon: FiClock,
      color: c.warning,
      bgColor: c.badgeWarning,
    },
    {
      label: 'Overdue',
      value: dashboardData?.taskStatistics?.overdueTasks ?? 0,
      icon: FiAlertCircle,
      color: c.danger,
      bgColor: c.badgeDanger,
    },
  ] : []

  const activityScore = dashboardData?.userProductivity?.activityScore ?? 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: c.heading }}>Dashboard</h1>
        <p style={{ color: c.textSecondary }} className="text-xs sm:text-sm">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={`stat-${index}`} stat={stat} index={index} c={c} />
          ))}
        </div>
      )}

      {/* Recent Activity & Productivity Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <h2 style={{ color: c.heading }} className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            {isLoadingActivities ? (
              <RecentActivitySkeleton />
            ) : recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <ActivityItem 
                  key={activity.id || index} 
                  activity={activity} 
                  index={index}
                  lastIndex={recentActivities.length - 1}
                  c={c}
                />
              ))
            ) : (
              <p style={{ color: c.textMuted }} className="text-center py-6 sm:py-8 text-xs sm:text-sm">
                No recent activity
              </p>
            )}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 style={{ color: c.heading }} className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Productivity Score</h2>
          <div className="flex items-center justify-center py-8 sm:py-10">
            <div className="text-center">
              <div style={{ color: c.primary }} className="text-4xl sm:text-5xl font-bold mb-1.5 sm:mb-2">
                {activityScore?.toFixed(0) || 0}
              </div>
              <p style={{ color: c.textSecondary }} className="text-xs sm:text-sm">Activity Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard
