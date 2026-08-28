import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Zap, Sparkles, UserPlus, FileText, MailCheck, Eye, MousePointerClick, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { automationService } from '../services/automationService'

const TRIGGER_OPTIONS = [
  {
    type: 'LEAD_CREATED',
    label: 'Lead Created',
    description: 'Triggers immediately when a new lead enters your CRM',
    icon: UserPlus,
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    type: 'LEAD_MAGNET_SUBMITTED',
    label: 'Lead Magnet Submitted',
    description: 'Triggers when a prospect submits a lead magnet form',
    icon: FileText,
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    type: 'EMAIL_DELIVERED',
    label: 'Email Delivered',
    description: 'Triggers when an email campaign is delivered successfully',
    icon: MailCheck,
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    type: 'EMAIL_OPENED',
    label: 'Email Opened',
    description: 'Triggers when a recipient opens one of your emails',
    icon: Eye,
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    type: 'EMAIL_CLICKED',
    label: 'Email Clicked',
    description: 'Triggers when a recipient clicks a link inside your email',
    icon: MousePointerClick,
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    type: 'EMAIL_BOUNCED',
    label: 'Email Bounced',
    description: 'Triggers when an email bounce event is detected',
    icon: AlertTriangle,
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
]

export default function CreateAutomationPage() {
  const navigate = useNavigate()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => automationService.createAutomation(currentWorkspace.id, data),
    onSuccess: (created) => {
      const createdId = created?.id || created?.data?.id
      if (!createdId) {
        toast.error('Automation created, but ID was missing from response.')
        return
      }
      toast.success('Automation created successfully!')
      navigate(`/marketing/automations/${createdId}/edit`)
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to create automation')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter an automation name')
      return
    }
    if (!triggerType) {
      toast.error('Please select a trigger type')
      return
    }
    if (!currentWorkspace?.id) {
      toast.error('No workspace selected')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      triggerType,
      triggerConfig: {},
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0D1117] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation */}
        <button
          type="button"
          onClick={() => navigate('/marketing/automations')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Automations
        </button>

        {/* Header */}
        <div className="mb-8 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Automation</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set up automated workflows to engage leads, route tasks, and boost conversion rates.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#161B22] p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-[#30363D] shadow-sm space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="automation-name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Automation Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="automation-name"
                type="text"
                required
                placeholder="e.g. Welcome & Onboard New B2B Leads"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#0D1117] px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="automation-desc" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="automation-desc"
                rows={3}
                placeholder="Describe the purpose of this workflow..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#0D1117] px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
              />
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Select Trigger Event <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Choose the event that initiates this automated sequence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRIGGER_OPTIONS.map((item) => {
                  const Icon = item.icon
                  const isSelected = triggerType === item.type
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setTriggerType(item.type)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 ring-2 ring-violet-600/30'
                          : 'border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#0D1117] hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border ${item.badgeColor}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {item.label}
                          </h4>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-violet-600 ring-4 ring-violet-200 dark:ring-violet-900" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/marketing/automations')}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim() || !triggerType}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Build Automation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
