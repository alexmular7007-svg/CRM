import { memo, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiCpu,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { format, parseISO, subDays } from 'date-fns'
import { analyticsService } from '../services/analyticsService'
import { aiService } from '../services/aiService'
import { getLeadAnalytics } from '../services/crmService'
import { workspaceService } from '../services/workspaceService'
import { projectService } from '../services/projectService'
import { setAnalyticsFilters, resetAnalyticsFilters } from '../store/slices/analyticsSlice'
import { useThemeContext } from '../contexts/ThemeContext'
import Spinner from '../components/common/Spinner'

const getThemeStatusColors = (theme = {}) => ({
  TODO: theme?.colors?.textMuted ?? '#6b7280',
  IN_PROGRESS: theme?.colors?.info ?? '#3b82f6',
  IN_REVIEW: theme?.colors?.warning ?? '#f97316',
  DONE: theme?.colors?.success ?? '#10b981',
  BLOCKED: theme?.colors?.danger ?? '#ef4444',
  LEAD: theme?.colors?.textMuted ?? '#6b7280',
  QUALIFIED: theme?.colors?.info ?? '#3b82f6',
  PROPOSAL: '#8b5cf6',
  NEGOTIATION: '#f97316',
  WON: theme?.colors?.success ?? '#10b981',
  LOST: theme?.colors?.danger ?? '#ef4444',
})

const PRIORITY_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444']

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('en-US')

const getPageContent = (payload) => payload?.content ?? payload ?? []

const mapToChart = (source = {}, label = 'name') => (
  Object.entries(source).map(([name, value]) => ({
    [label]: name.replaceAll('_', ' '),
    key: name,
    value: Number(value || 0),
  }))
)

const createDateSeries = (activitiesByDate = {}) => (
  Object.entries(activitiesByDate)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, value]) => ({
      date,
      label: format(parseISO(date), 'MMM d'),
      value: Number(value || 0),
    }))
)

const KpiCard = memo(({ title, value, detail, icon: Icon, tone = 'blue', trend, sparkline = [], themeColors = {} }) => {
  // Safe defaults for theme colors
  const safeColors = {
    info: themeColors?.info ?? '#3b82f6',
    success: themeColors?.success ?? '#10b981',
    warning: themeColors?.warning ?? '#f97316',
    primary: themeColors?.primary ?? '#3b82f6',
    textMuted: themeColors?.textMuted ?? '#6b7280',
  }

  const toneClasses = {
    blue: `${safeColors.info}30`,
    green: `${safeColors.success}30`,
    orange: `${safeColors.warning}30`,
    purple: `${safeColors.primary}30`,
    slate: `${safeColors.textMuted}30`,
  }

  const toneBg = {
    blue: safeColors.info,
    green: safeColors.success,
    orange: safeColors.warning,
    purple: safeColors.primary,
    slate: safeColors.textMuted,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/70 dark:bg-gray-800/80"
    >
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${toneClasses[tone]} opacity-10 blur-2xl`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-3xl font-black text-gray-950 dark:text-white"
          >
            {value}
          </motion.p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{detail}</p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${toneClasses[tone]} p-3 text-white shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-xs font-bold ${Number(trend) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend !== undefined ? `${Number(trend) >= 0 ? '+' : ''}${Number(trend).toFixed(1)}% trend` : 'Live snapshot'}
        </span>
        {sparkline.length > 0 && (
          <div className="h-8 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  )
})

KpiCard.displayName = 'KpiCard'

const ChartCard = memo(({ title, subtitle, children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-3xl border border-gray-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/70 dark:bg-gray-800/80 ${className}`}
  >
    <div className="mb-4">
      <h3 className="text-lg font-bold text-gray-950 dark:text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
))

ChartCard.displayName = 'ChartCard'

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="h-44 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  </div>
)

const Analytics = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { currentTheme, theme: themeId } = useThemeContext()
  
  // Fallback theme colors if currentTheme is undefined
  const theme = currentTheme && currentTheme.colors ? currentTheme : {
    colors: {
      textMuted: '#6b7280',
      info: '#3b82f6',
      warning: '#f97316',
      success: '#10b981',
      danger: '#ef4444',
      primary: '#3b82f6',
    }
  }
  
  const STATUS_COLORS = getThemeStatusColors(theme ?? {})
  const c = theme?.colors ?? {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f97316',
    danger: '#ef4444',
    primary: '#3b82f6',
    textMuted: '#6b7280',
  }
  const { filters } = useSelector((state) => state.analytics)
  const { unreadCount } = useSelector((state) => state.notifications)
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const [debouncedFilters, setDebouncedFilters] = useState(filters)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFilters(filters), 250)
    return () => clearTimeout(timeout)
  }, [filters])

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] }, { exact: false })
  }, [queryClient, unreadCount])

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
    staleTime: 5 * 60 * 1000,
  })

  const workspaceList = useMemo(() => getPageContent(workspaces), [workspaces])
  const activeWorkspaceId = debouncedFilters.workspaceId || currentWorkspace?.id || workspaceList[0]?.id || null

  const { data: projectsPage = [] } = useQuery({
    queryKey: ['analytics-projects', activeWorkspaceId],
    queryFn: () => projectService.getAll(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { data: membersPage = [] } = useQuery({
    queryKey: ['analytics-members', activeWorkspaceId],
    queryFn: () => workspaceService.getMembers(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const projects = useMemo(() => getPageContent(projectsPage), [projectsPage])
  const members = useMemo(() => getPageContent(membersPage), [membersPage])

  const dateParams = useMemo(() => ({
    startDate: debouncedFilters.startDate,
    endDate: debouncedFilters.endDate,
  }), [debouncedFilters.endDate, debouncedFilters.startDate])

  const dashboardQuery = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analyticsService.getDashboard,
    refetchInterval: 60000,
    retry: false,
    throwOnError: false,
  })

  const taskQuery = useQuery({
    queryKey: ['analytics', 'tasks', activeWorkspaceId, dateParams],
    queryFn: () => analyticsService.getTaskAnalytics({ ...dateParams, workspaceId: activeWorkspaceId }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 30000,
    retry: false,
    throwOnError: false,
  })

  const teamQuery = useQuery({
    queryKey: ['analytics', 'team', activeWorkspaceId, dateParams],
    queryFn: () => analyticsService.getTeamPerformance({ ...dateParams, workspaceId: activeWorkspaceId }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 30000,
    retry: false,
    throwOnError: false,
  })

  const activityQuery = useQuery({
    queryKey: ['analytics', 'activity', activeWorkspaceId, dateParams],
    queryFn: () => analyticsService.getActivityAnalytics({ ...dateParams, workspaceId: activeWorkspaceId }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 30000,
    retry: false,
    throwOnError: false,
  })

  const crmQuery = useQuery({
    queryKey: ['analytics', 'crm', activeWorkspaceId],
    queryFn: () => getLeadAnalytics(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 30000,
    retry: false,
    throwOnError: false,
  })

  const aiQuery = useQuery({
    queryKey: ['analytics', 'ai-productivity'],
    queryFn: aiService.getProductivityInsights,
    staleTime: 2 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })

  const isInitialLoading = dashboardQuery.isLoading || taskQuery.isLoading || teamQuery.isLoading || activityQuery.isLoading

  const dashboard = dashboardQuery.data || {}
  const taskAnalytics = taskQuery.data || {}
  const team = teamQuery.data || {}
  const activity = activityQuery.data || {}
  const crm = crmQuery.data || {}
  const ai = aiQuery.data || {}

  const activitySeries = useMemo(() => createDateSeries(activity.activitiesByDate), [activity.activitiesByDate])
  const taskStatusData = useMemo(() => mapToChart(taskAnalytics.tasksByStatus), [taskAnalytics.tasksByStatus])
  const taskPriorityData = useMemo(() => mapToChart(taskAnalytics.tasksByPriority), [taskAnalytics.tasksByPriority])
  const crmValueData = useMemo(() => mapToChart(crm.valueByStatus), [crm.valueByStatus])
  const crmLeadData = useMemo(() => mapToChart(crm.leadsByStatus), [crm.leadsByStatus])
  const activityTypeData = useMemo(() => mapToChart(activity.activitiesByType), [activity.activitiesByType])

  const filteredPerformers = useMemo(() => {
    const performers = team.topPerformers || []
    if (!debouncedFilters.userId) return performers
    return performers.filter((performer) => performer.userId === Number(debouncedFilters.userId))
  }, [debouncedFilters.userId, team.topPerformers])

  const selectedProjectName = projects.find((project) => project.id === Number(debouncedFilters.projectId))?.name
  const selectedMemberName = members.find((member) => member.userId === Number(debouncedFilters.userId))?.userName

  const heatmapCells = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 35 }).map((_, index) => {
      const date = format(subDays(today, 34 - index), 'yyyy-MM-dd')
      const value = Number(activity.activitiesByDate?.[date] || 0)
      return { date, value }
    })
  }, [activity.activitiesByDate])

  const completionRate = taskAnalytics.completionRate ?? dashboard.taskStatistics?.completionRate ?? 0
  const activityScore = dashboard.userProductivity?.activityScore ?? ai.productivityScore ?? 0

  if (isInitialLoading) return <AnalyticsSkeleton />

  const isDarkTheme = themeId === 'dark'

  return (
    <div className="space-y-6">
      <div 
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-xl"
        style={{
          background: isDarkTheme 
            ? 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 58, 138) 50%, rgb(15, 23, 42) 100%)'
            : currentTheme?.colors?.surface || '#FFFFFF',
          borderColor: isDarkTheme 
            ? 'rgba(99, 102, 241, 0.4)'
            : currentTheme?.colors?.border || '#D1D5DB',
        }}
      >
        {isDarkTheme && (
          <>
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-orange-400/10 blur-2xl" />
          </>
        )}
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p 
              className="text-sm font-bold uppercase tracking-[0.25em]"
              style={{
                color: isDarkTheme ? '#06B6D4' : currentTheme?.colors?.primary || '#3B82F6'
              }}
            >
              Enterprise Analytics
            </p>
            <h1 
              className="mt-3 text-4xl font-black tracking-tight"
              style={{
                color: isDarkTheme ? '#FFFFFF' : currentTheme?.colors?.text || '#0F172A'
              }}
            >
              Revenue, work, and collaboration in one cockpit
            </h1>
            <p 
              className="mt-3 max-w-3xl"
              style={{
                color: isDarkTheme ? '#BEE3F8' : currentTheme?.colors?.textSecondary || '#334155'
              }}
            >
              Live operational intelligence from tasks, CRM, activity, AI recommendations, and team performance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs" style={{ color: isDarkTheme ? '#BEE3F8' : currentTheme?.colors?.textSecondary || '#334155' }}>
              {selectedProjectName && <span className="rounded-full px-3 py-1" style={{ backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : currentTheme?.colors?.surfaceSecondary || '#F1F5F9' }}>Project: {selectedProjectName}</span>}
              {selectedMemberName && <span className="rounded-full px-3 py-1" style={{ backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : currentTheme?.colors?.surfaceSecondary || '#F1F5F9' }}>Member: {selectedMemberName}</span>}
              {debouncedFilters.crmStage && <span className="rounded-full px-3 py-1" style={{ backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : currentTheme?.colors?.surfaceSecondary || '#F1F5F9' }}>CRM: {debouncedFilters.crmStage}</span>}
            </div>
          </div>

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['analytics'] }, { exact: false })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:opacity-80"
            style={{
              backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : currentTheme?.colors?.surfaceSecondary || '#F1F5F9',
              color: isDarkTheme ? '#FFFFFF' : currentTheme?.colors?.text || '#0F172A',
              border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.2)' : currentTheme?.colors?.border || '#D1D5DB'}`
            }}
          >
            <FiRefreshCw className={dashboardQuery.isFetching ? 'animate-spin' : ''} />
            Refresh live data
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <FiFilter />
          Dashboard filters
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="date"
            className="input"
            value={filters.startDate}
            onChange={(event) => dispatch(setAnalyticsFilters({ startDate: event.target.value }))}
          />
          <input
            type="date"
            className="input"
            value={filters.endDate}
            onChange={(event) => dispatch(setAnalyticsFilters({ endDate: event.target.value }))}
          />
          <select
            className="input"
            value={filters.workspaceId || activeWorkspaceId || ''}
            onChange={(event) => dispatch(setAnalyticsFilters({ workspaceId: event.target.value ? Number(event.target.value) : null, projectId: null, userId: null }))}
          >
            {workspaceList.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.projectId || ''}
            onChange={(event) => dispatch(setAnalyticsFilters({ projectId: event.target.value ? Number(event.target.value) : null }))}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.userId || ''}
            onChange={(event) => dispatch(setAnalyticsFilters({ userId: event.target.value ? Number(event.target.value) : null }))}
          >
            <option value="">All members</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>{member.userName}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.crmStage}
            onChange={(event) => dispatch(setAnalyticsFilters({ crmStage: event.target.value }))}
          >
            <option value="">All CRM stages</option>
            {['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => dispatch(resetAnalyticsFilters())}
          className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Reset filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total tasks" value={number.format(taskAnalytics.totalTasks || dashboard.taskStatistics?.totalTasks || 0)} detail="Tracked in selected period" icon={FiTarget} tone="blue" sparkline={activitySeries} themeColors={c} />
        <KpiCard title="Completed tasks" value={number.format(taskAnalytics.completedTasks || dashboard.taskStatistics?.completedTasks || 0)} detail={`${completionRate.toFixed(1)}% completion rate`} icon={FiCheckCircle} tone="green" trend={completionRate - 50} themeColors={c} />
        <KpiCard title="Active projects" value={number.format(dashboard.projectStatistics?.activeProjects || 0)} detail={`${dashboard.projectStatistics?.averageProgress?.toFixed?.(1) || 0}% average progress`} icon={FiBriefcase} tone="purple" themeColors={c} />
        <KpiCard title="Pipeline value" value={currency.format(Number(crm.totalPipelineValue || 0))} detail={`${number.format(crm.totalLeads || 0)} active CRM leads`} icon={FiDollarSign} tone="green" themeColors={c} />
        <KpiCard title="Won / Lost" value={`${number.format(crm.leadsByStatus?.WON || 0)} / ${number.format(crm.leadsByStatus?.LOST || 0)}`} detail={currency.format(Number(crm.wonValue || 0)) + ' won value'} icon={FiTrendingUp} tone="orange" trend={crm.conversionRate || 0} themeColors={c} />
        <KpiCard title="Team activity score" value={Number(activityScore || 0).toFixed(1)} detail={`${number.format(activity.totalActivities || 0)} logged activities`} icon={FiActivity} tone="blue" sparkline={activitySeries} themeColors={c} />
        <KpiCard title="Chat activity" value={number.format(team.totalTeamMessages || dashboard.userProductivity?.messagesSet || 0)} detail="Messages in team workflow" icon={FiUsers} tone="slate" themeColors={c} />
        <KpiCard title="Notifications" value={number.format(dashboard.notificationStatistics?.unreadCount ?? unreadCount ?? 0)} detail={`${number.format(dashboard.notificationStatistics?.totalCount || 0)} total notifications`} icon={FiZap} tone="orange" themeColors={c} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Task completion trend" subtitle="Activity-backed completion velocity over time">
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={activitySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="CRM revenue funnel" subtitle="Deal value by stage">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={crmValueData.filter((item) => !debouncedFilters.crmStage || item.key === debouncedFilters.crmStage)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {crmValueData.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#f97316'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task status distribution" subtitle="Current task mix">
          <ResponsiveContainer width="100%" height={310}>
            <PieChart>
              <Pie data={taskStatusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                {taskStatusData.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#64748b'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Team productivity" subtitle="Top performer activity scores">
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={filteredPerformers.map((performer) => ({ name: performer.userName, value: performer.activityScore || 0 }))}>
              <defs>
                <linearGradient id="productivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#productivity)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead conversion trends" subtitle="Lead counts by funnel stage">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={crmLeadData.filter((item) => !debouncedFilters.crmStage || item.key === debouncedFilters.crmStage)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly activity overview" subtitle="Activity types across the workspace">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={activityTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ChartCard title="Activity heatmap" subtitle="Last 35 days">
          <div className="grid grid-cols-7 gap-2">
            {heatmapCells.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.value} activities`}
                className="aspect-square rounded-lg border border-white/60 dark:border-gray-800"
                style={{ backgroundColor: `rgba(37, 99, 235, ${Math.min(0.15 + cell.value / 20, 0.95)})` }}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top performers" subtitle="Productivity rankings">
          <div className="space-y-3">
            {filteredPerformers.slice(0, 6).map((performer) => (
              <div key={performer.userId} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                    {performer.rank || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{performer.userName}</p>
                    <p className="text-xs text-gray-500">{performer.tasksCompleted} tasks, {performer.commentsPosted} comments</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">{Number(performer.activityScore || 0).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="AI insights" subtitle="Generated by the existing AI backend">
          {aiQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-100">
                  <FiCpu />
                  Productivity score
                </div>
                <p className="mt-2 text-4xl font-black">{Number(ai.productivityScore || 0).toFixed(1)}</p>
                <p className="mt-2 text-sm text-violet-100">{ai.overallAssessment || 'AI assessment is unavailable for the current dataset.'}</p>
              </div>
              {(ai.recommendations || []).slice(0, 4).map((recommendation, index) => (
                <div key={recommendation} className="flex gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/50">
                  <FiAlertTriangle className="mt-1 flex-shrink-0 text-orange-500" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{index + 1}. {recommendation}</p>
                </div>
              ))}
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Trend: {ai.trend || 'Not enough signal yet'}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Task priority breakdown" subtitle="Workload distribution by urgency">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={taskPriorityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415522" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {taskPriorityData.map((entry, index) => <Cell key={entry.key} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

export default Analytics
