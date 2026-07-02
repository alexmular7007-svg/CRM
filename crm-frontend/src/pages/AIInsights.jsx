import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  Users,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Calendar,
  Target,
  DollarSign,
  Info,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { aiService } from '../services/aiService'
import { workspaceService } from '../services/workspaceService'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { setCurrentWorkspace } from '../store/slices/workspaceSlice'
import Spinner from '../components/common/Spinner'

const AIInsights = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [activeTab, setActiveTab] = useState('health') // 'health' or 'trends'
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [workspacesList, setWorkspacesList] = useState([])
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false)

  // Fetch all workspaces for selector
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
  })

  useEffect(() => {
    if (workspacesData) {
      const items = Array.isArray(workspacesData) ? workspacesData : workspacesData?.content ?? []
      setWorkspacesList(items)
      // Auto-select workspace: prefer currentWorkspace if still in the list,
      // otherwise pick the first available workspace
      if (items.length > 0 && !currentWorkspace) {
        dispatch(setCurrentWorkspace(items[0]))
      } else if (currentWorkspace && !items.find(w => w.id === currentWorkspace.id)) {
        // Current workspace no longer accessible — fall back to first
        dispatch(setCurrentWorkspace(items[0]))
      }
    }
  }, [workspacesData, currentWorkspace, dispatch])

  const workspaceId = currentWorkspace?.id

  // Fetch unified workspace insights
  const { data: insightsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['workspaceInsights', workspaceId],
    queryFn: () => aiService.getWorkspaceInsights(workspaceId, false),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  })

  // Fetch projects (needed for quick task creation context)
  const { data: projectsData } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectService.getAll(workspaceId),
    enabled: !!workspaceId,
  })

  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.content ?? projectsData?.data?.content ?? []

  const handleRefresh = async () => {
    if (isRefreshing || isFetching) return
    setIsRefreshing(true)
    try {
      const freshData = await aiService.getWorkspaceInsights(workspaceId, true)
      queryClient.setQueryData(['workspaceInsights', workspaceId], freshData)
      toast.success('Workspace insights updated successfully')
    } catch (err) {
      toast.error('Failed to update insights: ' + (err.message || 'Error occurred'))
    } finally {
      setIsRefreshing(false)
    }
  }

  // Quick Action execution handler
  const handleQuickAction = async (rec) => {
    const { actionType, actionPayload } = rec
    const loadingToast = toast.loading('Executing action...')

    try {
      if (actionType === 'REASSIGN') {
        const { taskId, assigneeId, targetUserName } = actionPayload
        // Fetch original task details
        const taskDetails = await taskService.getById(taskId)
        // Update task assignee
        await taskService.update(taskId, {
          title: taskDetails.title,
          status: taskDetails.status,
          priority: taskDetails.priority,
          assignedToId: assigneeId,
          workspaceId: currentWorkspace?.id
        })
        toast.success(`Task reassigned to ${targetUserName || 'new member'}`)
      } else if (actionType === 'FOLLOW_UP') {
        const { leadId, leadName } = actionPayload
        // Pick first project to link task to workspace
        const targetProject = projects.find(p => p.status === 'ACTIVE') || projects[0]
        if (!targetProject) {
          throw new Error('Please create at least one project first to attach tasks.')
        }
        await taskService.create({
          title: `Follow up with lead: ${leadName}`,
          description: `AI recommended pipeline action. Idle follow-up. Lead ID: ${leadId}`,
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          projectId: targetProject.id,
          workspaceId: currentWorkspace?.id  // ← Include workspace ID from Redux
        })
        toast.success(`Follow-up task created in project "${targetProject.name}"`)
      } else if (actionType === 'VIEW_TASK') {
        window.location.href = `/projects/${actionPayload.projectId || 'all'}/kanban`
        return
      } else if (actionType === 'VIEW_PROJECT') {
        window.location.href = `/workspaces/${workspaceId}/projects`
        return
      }
      
      // Refresh insights calculation
      await handleRefresh()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-[#30363D]">
        <Zap className="h-16 w-16 text-violet-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Workspace Selected</h2>
        <p className="text-gray-500 dark:text-[#8B949E] mb-6 max-w-sm">
          Please select or create a workspace to load active AI management insights.
        </p>
        <button
          onClick={() => setShowWorkspaceSelector(true)}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium shadow-md transition-all"
        >
          Select Workspace
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-[#8B949E] animate-pulse">
          Analyzing project metrics & generating insights...
        </p>
      </div>
    )
  }

  const insights = insightsData || {}
  const health = insights.health || { score: 100, status: 'Healthy', explanation: '', factors: [], why: [] }
  const projectRisks = insights.projectRisks || []
  const workload = insights.workload || []
  const recommendations = insights.recommendations || []
  const crmInsights = insights.crmInsights || []
  const weeklySummary = insights.weeklySummary || { tasksCompleted: 0, newLeadsAdded: 0, activeProjects: 0, overdueTasks: 0, topContributor: 'None', highestRiskProject: 'None', summaryText: '' }
  const predictions = insights.predictions || []
  const trends = insights.trends || { dates: [], healthScores: [], overdueTasks: [], leadConversions: [] }

  // Detect empty workspace — no tasks AND no projects AND no leads
  const isEmptyWorkspace = insightsData &&
    weeklySummary.activeProjects === 0 &&
    (workload.length === 0 || workload.every(w => w.activeTasks === 0 && w.completedTasks === 0)) &&
    projectRisks.length === 0 &&
    crmInsights.length === 0

  // Custom Inline SVG Line Chart Generator
  const drawLineChartPath = (dataValues, width = 500, height = 150) => {
    if (!dataValues || dataValues.length === 0) return ''
    const maxVal = Math.max(...dataValues, 1)
    const minVal = Math.min(...dataValues, 0)
    const range = maxVal - minVal
    
    return dataValues.map((val, index) => {
      const x = (index / (dataValues.length - 1)) * width
      const y = height - ((val - minVal) / range) * (height - 20) - 10
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-gray-900 dark:text-[#E6EDF3] pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-[#30363D] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Sparkles size={11} />
              Grok-4.20
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-[#8B949E] mt-1">
            Continuous workspace intelligence monitoring dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace dropdown selector */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#21262D] transition-colors"
            >
              <FolderOpen size={16} className="text-gray-400" />
              <span>{currentWorkspace?.name || 'Select Workspace'}</span>
              <ChevronRight size={14} className="text-gray-400 transform rotate-90" />
            </button>
            
            {showWorkspaceSelector && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-xl shadow-lg z-50 p-1.5">
                <div className="text-[11px] font-semibold text-gray-400 dark:text-[#8B949E] px-3 py-1.5 uppercase">Workspaces</div>
                {workspacesList.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      dispatch(setCurrentWorkspace(ws))
                      setShowWorkspaceSelector(false)
                    }}
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg text-left ${
                      ws.id === workspaceId
                        ? 'bg-gray-100 dark:bg-[#21262D] font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-[#21262D]/60'
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            className={`flex items-center justify-center p-2 text-gray-500 dark:text-[#8B949E] hover:text-gray-900 dark:hover:text-[#E6EDF3] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-lg transition-colors ${
              isRefreshing || isFetching ? 'opacity-50' : ''
            }`}
            title="Refresh Insights"
          >
            <RefreshCw size={18} className={`${isRefreshing || isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Empty workspace notice */}
      {isEmptyWorkspace && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-start gap-4">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              This workspace has no data yet
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              AI Insights needs tasks, projects, or CRM leads to generate meaningful analysis.
              Create tasks and projects in this workspace, or switch to a workspace that already
              has data using the selector above.
            </p>
            <div className="mt-3 flex gap-2">
              {workspacesList.filter(w => w.id !== workspaceId).map(ws => (
                <button
                  key={ws.id}
                  onClick={() => dispatch(setCurrentWorkspace(ws))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors"
                >
                  Switch to: {ws.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Health Circular Indicator & Why Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#30363D] pb-3 mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Target size={18} className="text-violet-500" />
                Workspace Health Score
              </h2>
              <div className="flex bg-gray-100 dark:bg-[#21262D] rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab('health')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'health' ? 'bg-white dark:bg-[#30363D] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Score Factors
                </button>
                <button
                  onClick={() => setActiveTab('trends')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'trends' ? 'bg-white dark:bg-[#30363D] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Last 7 Days
                </button>
              </div>
            </div>

            {activeTab === 'health' ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                {/* Score gauge */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D]">
                  <div className="relative flex items-center justify-center h-32 w-32">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className="text-gray-200 dark:text-[#21262D]"
                        strokeWidth="8"
                        fill="transparent"
                        stroke="currentColor"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        className="text-violet-500"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - health.score / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <div className="text-3xl font-extrabold">{health.score}</div>
                      <div className="text-[10px] text-gray-400 dark:text-[#8B949E] uppercase tracking-wider">Score / 100</div>
                    </div>
                  </div>
                  <span className={`mt-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    health.status === 'Healthy'
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                      : health.status === 'Moderate Risk'
                      ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  }`}>
                    {health.status}
                  </span>
                </div>

                {/* Score Factor detail list */}
                <div className="md:col-span-3 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-[#8B949E] uppercase tracking-wider">Health Factors</h3>
                  {health.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-[#0D1117]/60 rounded-lg border border-gray-100 dark:border-[#21262D]">
                      <span className="font-medium text-gray-700 dark:text-[#C9D1D9]">{f.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 dark:text-[#8B949E]">{f.value}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          f.status === 'SUCCESS' ? 'bg-green-500' : f.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Inline SVG Trends Line Charts */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health trend */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Health Score Trend</span>
                    <span className="text-green-500">
                      {trends.healthScores[0]} → {trends.healthScores[trends.healthScores.length - 1]}
                    </span>
                  </div>
                  <div className="h-24 bg-gray-50 dark:bg-[#0D1117] rounded-lg border border-gray-100 dark:border-[#21262D] p-2 flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                      <path
                        d={drawLineChartPath(trends.healthScores)}
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Overdue tasks trend */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Overdue Tasks Trend</span>
                    <span className="text-red-500">
                      {trends.overdueTasks[0]} → {trends.overdueTasks[trends.overdueTasks.length - 1]}
                    </span>
                  </div>
                  <div className="h-24 bg-gray-50 dark:bg-[#0D1117] rounded-lg border border-gray-100 dark:border-[#21262D] p-2 flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                      <path
                        d={drawLineChartPath(trends.overdueTasks)}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Lead conversion trend */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Lead Conversion Trend</span>
                    <span className="text-green-500">
                      {trends.leadConversions[0]}% → {trends.leadConversions[trends.leadConversions.length - 1]}%
                    </span>
                  </div>
                  <div className="h-24 bg-gray-50 dark:bg-[#0D1117] rounded-lg border border-gray-100 dark:border-[#21262D] p-2 flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                      <path
                        d={drawLineChartPath(trends.leadConversions)}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400 dark:text-[#8B949E] flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-[#21262D]">
            <Info size={12} />
            <span>Updates hourly. Force refresh to pull live metrics.</span>
          </div>
        </div>

        {/* Why score checklist */}
        <div className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2 border-b border-gray-100 dark:border-[#30363D] pb-3 mb-4">
              <Info size={18} className="text-blue-500" />
              Why this score?
            </h2>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {health.why.map((w, index) => (
                <div key={index} className="flex gap-2 text-xs items-start">
                  {w.type === 'SUCCESS' && <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />}
                  {w.type === 'WARNING' && <AlertTriangle size={15} className="text-yellow-500 mt-0.5 flex-shrink-0" />}
                  {w.type === 'DANGER' && <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />}
                  {w.type === 'INFO' && <Sparkles size={15} className="text-violet-500 mt-0.5 flex-shrink-0" />}
                  <span className={w.type === 'INFO' ? 'text-gray-700 dark:text-[#C9D1D9] font-medium leading-relaxed' : 'text-gray-600 dark:text-[#8B949E] leading-relaxed'}>
                    {w.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {health.explanation && (
            <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-lg text-xs leading-relaxed text-violet-800 dark:text-violet-300">
              {health.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Executive Summary Card */}
      {weeklySummary && (
        <div className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-violet-500" />
            <h2 className="text-base font-semibold">Weekly Summary & Metrics</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            <div className="lg:col-span-1 grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] text-center">
                <div className="text-xl font-bold">{weeklySummary.tasksCompleted}</div>
                <div className="text-[10px] text-gray-500 uppercase mt-0.5">Completed</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] text-center">
                <div className="text-xl font-bold">{weeklySummary.newLeadsAdded}</div>
                <div className="text-[10px] text-gray-500 uppercase mt-0.5">New Leads</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] text-center">
                <div className="text-xl font-bold">{weeklySummary.activeProjects}</div>
                <div className="text-[10px] text-gray-500 uppercase mt-0.5">Projects</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] text-center">
                <div className="text-xl font-bold text-red-500">{weeklySummary.overdueTasks}</div>
                <div className="text-[10px] text-gray-500 uppercase mt-0.5">Overdue</div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="text-sm leading-relaxed text-gray-600 dark:text-[#C9D1D9] bg-gray-50 dark:bg-[#0D1117] p-4 rounded-xl border border-gray-100 dark:border-[#21262D]">
                {weeklySummary.summaryText}
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <User size={13} className="text-green-500" />
                  <span>Top Contributor: <strong>{weeklySummary.topContributor}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <AlertTriangle size={13} className="text-red-500" />
                  <span>Highest Risk Project: <strong>{weeklySummary.highestRiskProject}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Recommendations Deck */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-500" />
          <h2 className="text-base font-semibold">AI Recommended Next Actions</h2>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-5 rounded-xl hover:border-violet-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rec.type === 'WORKLOAD'
                        ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : rec.type === 'CRM'
                        ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    }`}>
                      {rec.type}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rec.priority === 'URGENT'
                        ? 'bg-red-500/15 text-red-600'
                        : rec.priority === 'HIGH'
                        ? 'bg-orange-500/15 text-orange-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-[#8B949E]'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed mb-4">{rec.suggestion}</p>
                </div>

                {rec.actionable && rec.actionText && (
                  <button
                    onClick={() => handleQuickAction(rec)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-violet-50 dark:bg-[#0D1117] dark:hover:bg-violet-950/30 border border-gray-200 dark:border-[#30363D] hover:border-violet-500/30 text-gray-700 hover:text-violet-600 dark:text-[#C9D1D9] dark:hover:text-violet-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 border border-dashed border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] rounded-xl">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold">All clear! No critical recommendations.</h4>
            <p className="text-xs text-gray-500 mt-1">Workspace activities are proceeding on track.</p>
          </div>
        )}
      </div>

      {/* Two Column Layout: Project Risk & predictions, Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Risk & predictions */}
        <div className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-[#30363D] pb-3">
            <FolderOpen size={18} className="text-violet-500" />
            <h2 className="text-base font-semibold">Project Risk Detection & Forecasts</h2>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {predictions.length > 0 ? (
              predictions.map((p, idx) => {
                const prRisk = projectRisks.find((r) => r.projectId === p.projectId)
                return (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold">{p.projectName}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                          <Clock size={11} />
                          <span>Expected: <strong>{new Date(p.expectedCompletionDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</strong></span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          p.delayRisk === 'HIGH'
                            ? 'bg-red-500/15 text-red-600'
                            : p.delayRisk === 'MEDIUM'
                            ? 'bg-yellow-500/15 text-yellow-600'
                            : 'bg-green-500/15 text-green-600'
                        }`}>
                          Risk: {p.delayRisk}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-200 dark:bg-[#21262D] rounded-full">
                          Conf: {p.confidenceLevel}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Current Progress</span>
                        <span>{p.currentProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${p.currentProgress}%` }} />
                      </div>
                    </div>

                    {prRisk && prRisk.explanation && (
                      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-[#8B949E] border-t border-gray-200/50 dark:border-[#21262D]/60 pt-2">
                        {prRisk.explanation}
                      </p>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">No active projects available to forecast.</p>
            )}
          </div>
        </div>

        {/* Team Workload & Burnout Alerts */}
        <div className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-[#30363D] pb-3">
            <Users size={18} className="text-violet-500" />
            <h2 className="text-base font-semibold">Team Workload & Burnout Alerts</h2>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {workload.length > 0 ? (
              workload.map((w, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-xs uppercase text-gray-600 dark:text-gray-400 flex-shrink-0">
                      {w.username.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold truncate">{w.username}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {w.activeTasks} active · {w.completedTasks} completed tasks
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      w.risk === 'HIGH'
                        ? 'bg-red-500/15 text-red-600'
                        : w.risk === 'MEDIUM'
                        ? 'bg-yellow-500/15 text-yellow-600'
                        : 'bg-green-500/15 text-green-600'
                    }`}>
                      {w.risk} Workload
                    </span>
                    <div className="text-[9px] text-gray-400 mt-1 max-w-[150px] truncate" title={w.recommendation}>
                      {w.recommendation}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">No workload assignments found.</p>
            )}
          </div>
        </div>
      </div>

      {/* CRM Opportunity Insights */}
      <div className="card border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-[#30363D] pb-3">
          <DollarSign size={18} className="text-violet-500" />
          <h2 className="text-base font-semibold">CRM Opportunity & Lead Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crmInsights.length > 0 ? (
            crmInsights.map((c, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-100 dark:border-[#21262D] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-bold">{c.leadName}</h4>
                      <span className="text-[10px] text-gray-400">{c.company}</span>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'Potential Lost Lead'
                        ? 'bg-red-500/15 text-red-600'
                        : c.status === 'Inactive Lead'
                        ? 'bg-yellow-500/15 text-yellow-600'
                        : 'bg-green-500/15 text-green-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500 my-3">
                    {c.dealValue && (
                      <span className="flex items-center gap-0.5">
                        <DollarSign size={12} className="text-green-500" />
                        <strong>${c.dealValue.toLocaleString()}</strong>
                      </span>
                    )}
                    <span>Idle: <strong>{c.lastFollowUpDays} days</strong></span>
                  </div>
                </div>

                <div className="text-[11px] leading-relaxed text-gray-600 dark:text-[#8B949E] bg-white dark:bg-[#161B22] p-2.5 rounded-lg border border-gray-100 dark:border-[#21262D] mt-2">
                  <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider block mb-0.5">Suggested Action</span>
                  {c.suggestedAction}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">All pipeline leads are active and recently updated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIInsights
