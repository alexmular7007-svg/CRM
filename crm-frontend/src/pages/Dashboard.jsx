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

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', currentWorkspace?.id],
    queryFn: () => currentWorkspace?.id 
      ? analyticsService.getDashboard(currentWorkspace.id) 
      : Promise.resolve(null),
    enabled: !!currentWorkspace?.id,
  })

  const { data: recentActivities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recentActivities', currentWorkspace?.id],
    queryFn: () => currentWorkspace?.id ? analyticsService.getRecentActivities(currentWorkspace.id, 10) : Promise.resolve([]),
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Tasks',
      value: dashboardData?.taskStatistics?.totalTasks || 0,
      icon: FiCheckCircle,
      color: c.info,
      bgColor: c.badgeInfo,
    },
    {
      label: 'Completed',
      value: dashboardData?.taskStatistics?.completedTasks || 0,
      icon: FiCheckCircle,
      color: c.success,
      bgColor: c.badgeSuccess,
    },
    {
      label: 'In Progress',
      value: dashboardData?.taskStatistics?.inProgressTasks || 0,
      icon: FiClock,
      color: c.warning,
      bgColor: c.badgeWarning,
    },
    {
      label: 'Overdue',
      value: dashboardData?.taskStatistics?.overdueTasks || 0,
      icon: FiAlertCircle,
      color: c.danger,
      bgColor: c.badgeDanger,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: c.heading }}>Dashboard</h1>
        <p style={{ color: c.textSecondary }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.textSecondary }} className="text-sm mb-1">
                  {stat.label}
                </p>
                <p style={{ color: c.textPrimary }} className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div style={{ backgroundColor: stat.bgColor }} className="p-3 rounded-lg">
                <stat.icon style={{ color: stat.color }} className="text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 style={{ color: c.heading }} className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3" style={{ borderBottomColor: c.border, borderBottomWidth: index < recentActivities.length - 1 ? 1 : 0 }}>
                  <div style={{ 
                    backgroundColor: activity.type === 'TASK' ? c.badgeInfo : c.badgeWarning,
                    color: activity.type === 'TASK' ? c.badgeInfoText : c.badgeWarningText
                  }} className="px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap">
                    {activity.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.textPrimary }} className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p style={{ color: c.textMuted }} className="text-xs mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span style={{ color: c.textMuted }} className="text-xs">
                        {activity.createdBy}
                      </span>
                      <span style={{ color: c.textMuted }} className="text-xs">
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: c.textMuted }} className="text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ color: c.heading }} className="text-lg font-semibold mb-4">Productivity Score</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div style={{ color: c.primary }} className="text-5xl font-bold mb-2">
                {dashboardData?.userProductivity?.activityScore?.toFixed(0) || 0}
              </div>
              <p style={{ color: c.textSecondary }}>Activity Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
