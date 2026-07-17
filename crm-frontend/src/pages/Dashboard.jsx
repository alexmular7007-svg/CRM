import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { useSelector } from 'react-redux'
import Spinner from '../components/common/Spinner'
import { FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from 'react-icons/fi'
import { format } from 'date-fns'
import { useThemeContext } from '../contexts/ThemeContext'

const Dashboard = () => {
  const { currentTheme } = useThemeContext()
  const c = currentTheme.colors
  const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace)

  console.log('🔍 Dashboard: currentWorkspace:', currentWorkspace)

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', currentWorkspace?.id],
    queryFn: () => {
      console.log('📡 Fetching dashboard for workspace:', currentWorkspace?.id)
      return currentWorkspace?.id 
        ? analyticsService.getDashboard(currentWorkspace.id)
        : Promise.resolve(null)
    },
    enabled: !!currentWorkspace?.id,
    retry: 1,
  })

  console.log('📊 Dashboard data:', dashboardData)
  console.log('⏳ Dashboard loading:', isLoading)
  console.log('❌ Dashboard error:', error)

  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recentActivities', currentWorkspace?.id],
    queryFn: () => currentWorkspace?.id ? analyticsService.getRecentActivities(currentWorkspace.id, 10) : Promise.resolve([]),
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
    retry: false,
  })

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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

  const stats = [
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
  ]

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
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
        ))}
      </div>

      {/* Recent Activity & Productivity Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5">
          <h2 style={{ color: c.heading }} className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h2>
          <div className="space-y-3 sm:space-y-4">
            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 pb-2 sm:pb-3" style={{ borderBottomColor: c.border, borderBottomWidth: index < recentActivities.length - 1 ? 1 : 0 }}>
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
}

export default Dashboard
