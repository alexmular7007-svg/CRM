import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Play, Pause, AlertCircle, CheckCircle2, Workflow, History, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { automationService } from '../services/automationService'
import WorkflowCanvas from '../components/automation/WorkflowCanvas'
import StepConfigPanel from '../components/automation/StepConfigPanel'
import AutomationAnalyticsSection from '../components/automation/AutomationAnalyticsSection'

const statusStyles = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
  PAUSED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  ARCHIVED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border-rose-300 dark:border-rose-800',
}

const triggerTypeLabels = {
  LEAD_CREATED: 'Lead Created',
  LEAD_MAGNET_SUBMITTED: 'Lead Magnet Submitted',
  EMAIL_DELIVERED: 'Email Delivered',
  EMAIL_OPENED: 'Email Opened',
  EMAIL_CLICKED: 'Email Clicked',
  EMAIL_BOUNCED: 'Email Bounced',
}

export default function AutomationBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('builder') // 'builder' | 'analytics'
  const [selectedStep, setSelectedStep] = useState(null)
  const [automationName, setAutomationName] = useState('')
  const [automationStatus, setAutomationStatus] = useState('DRAFT')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const automation = useQuery({
    queryKey: ['automation', currentWorkspace?.id, id],
    queryFn: () => automationService.getAutomation(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  const steps = useQuery({
    queryKey: ['automation-steps', currentWorkspace?.id, id],
    queryFn: () => automationService.getSteps(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  useEffect(() => {
    if (automation.data) {
      setAutomationName(automation.data.name || '')
      setAutomationStatus(automation.data.status || 'DRAFT')
    }
  }, [automation.data])

  const updateAutomationMutation = useMutation({
    mutationFn: (data) =>
      automationService.updateAutomation(currentWorkspace.id, id, data),
    onSuccess: () => {
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 3000)
      toast.success('Automation saved successfully')
      queryClient.invalidateQueries({ queryKey: ['automation', currentWorkspace?.id, id] })
    },
    onError: (err) => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
      toast.error(err?.message || 'Failed to save automation')
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => automationService.activateAutomation(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Automation activated')
      setAutomationStatus('ACTIVE')
      queryClient.invalidateQueries({ queryKey: ['automation', currentWorkspace?.id, id] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to activate automation'),
  })

  const pauseMutation = useMutation({
    mutationFn: () => automationService.pauseAutomation(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Automation paused')
      setAutomationStatus('PAUSED')
      queryClient.invalidateQueries({ queryKey: ['automation', currentWorkspace?.id, id] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to pause automation'),
  })

  const addStepMutation = useMutation({
    mutationFn: (stepData) =>
      automationService.addStep(currentWorkspace.id, id, stepData),
    onSuccess: () => {
      toast.success('Step added to workflow')
      queryClient.invalidateQueries({ queryKey: ['automation-steps', currentWorkspace?.id, id] })
    },
    onError: () => toast.error('Failed to add step'),
  })

  const updateStepMutation = useMutation({
    mutationFn: (stepData) =>
      automationService.updateStep(currentWorkspace.id, id, stepData.id, stepData),
    onSuccess: () => {
      toast.success('Step configuration saved')
      queryClient.invalidateQueries({ queryKey: ['automation-steps', currentWorkspace?.id, id] })
      setSelectedStep(null)
    },
    onError: () => toast.error('Failed to save step configuration'),
  })

  const deleteStepMutation = useMutation({
    mutationFn: (stepId) =>
      automationService.deleteStep(currentWorkspace.id, id, stepId),
    onSuccess: () => {
      toast.success('Step removed')
      queryClient.invalidateQueries({ queryKey: ['automation-steps', currentWorkspace?.id, id] })
    },
    onError: () => toast.error('Failed to delete step'),
  })

  const reorderStepMutation = useMutation({
    mutationFn: ({ stepId, newOrder }) =>
      automationService.reorderSteps(currentWorkspace.id, id, stepId, newOrder),
    onSuccess: () => {
      toast.success('Step reordered')
      queryClient.invalidateQueries({ queryKey: ['automation-steps', currentWorkspace?.id, id] })
    },
    onError: () => toast.error('Failed to reorder step'),
  })

  const handleNameChange = (e) => {
    setAutomationName(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleSaveAutomation = () => {
    setSaveStatus('saving')
    updateAutomationMutation.mutate({ name: automationName })
  }

  if (automation.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    )
  }

  if (automation.isError || !automation.data) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 text-center">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-red-500" />
          <h3 className="font-bold">Failed to load automation</h3>
          <p className="text-xs mt-1 text-red-600 dark:text-red-300">
            The requested automation ID might not exist in this workspace.
          </p>
          <button
            type="button"
            onClick={() => navigate('/marketing/automations')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            Back to Automations
          </button>
        </div>
      </div>
    )
  }

  const workflowSteps = (steps.data || []).sort((a, b) => a.stepOrder - b.stepOrder)
  const triggerType = automation.data?.triggerType

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-[#0D1117]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/marketing/automations')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Automations</span>
            </button>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

            <div className="min-w-0 flex-1 flex items-center gap-2">
              <input
                type="text"
                value={automationName}
                onChange={handleNameChange}
                placeholder="Automation Name"
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1.5 py-0.5 truncate"
              />

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  statusStyles[automationStatus] || statusStyles.DRAFT
                }`}
              >
                {automationStatus}
              </span>

              {/* Trigger Info */}
              {triggerType && (
                <span className="hidden md:inline-block text-xs text-gray-500 dark:text-gray-400">
                  • Trigger: <span className="font-medium text-gray-700 dark:text-gray-300">{triggerTypeLabels[triggerType] || triggerType}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions & Save Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}

            {saveStatus === 'saving' && (
              <span className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <div className="h-2 w-2 bg-violet-600 rounded-full animate-pulse" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={14} /> Saved
              </span>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveAutomation}
              disabled={updateAutomationMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#21262D] px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#30363D] disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              Save
            </button>

            {/* Activate / Pause Button */}
            {automationStatus !== 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs sm:text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                <Play size={16} />
                Activate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs sm:text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                <Pause size={16} />
                Pause
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-4 mt-3 border-t border-gray-100 dark:border-gray-800 pt-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 pb-1 font-semibold border-b-2 transition-colors ${
              activeTab === 'builder'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Workflow size={15} /> Workflow Builder
          </button>
          <button
            type="button"
            onClick={() => navigate(`/marketing/automations/${id}/executions`)}
            className="flex items-center gap-1.5 pb-1 font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 transition-colors"
          >
            <History size={15} /> Execution History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 pb-1 font-semibold border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <BarChart3 size={15} /> Analytics
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'builder' ? (
        <div className="flex flex-1 overflow-hidden">
          <WorkflowCanvas
            steps={workflowSteps}
            selectedStep={selectedStep}
            onSelectStep={setSelectedStep}
            onDeleteStep={(stepId) => deleteStepMutation.mutate(stepId)}
            onAddStep={(stepData) => addStepMutation.mutate(stepData)}
            onReorderStep={(stepId, newOrder) => reorderStepMutation.mutate({ stepId, newOrder })}
          />

          <StepConfigPanel
            step={selectedStep}
            onClose={() => setSelectedStep(null)}
            onSave={(stepData) => updateStepMutation.mutate(stepData)}
            isSaving={updateStepMutation.isPending}
            workspaceId={currentWorkspace?.id}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#0D1117]">
          <AutomationAnalyticsSection automationId={id} />
        </div>
      )}
    </div>
  )
}
