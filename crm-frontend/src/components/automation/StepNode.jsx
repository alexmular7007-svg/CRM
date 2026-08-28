import { Trash2, Edit2, ZapOff, Mail, Zap, Clock, GitBranch, Lightbulb, Link2 } from 'lucide-react'

const stepTypeConfig = {
  // Triggers
  LEAD_CREATED: { icon: Zap, label: 'Lead Created', color: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-800' },
  LEAD_MAGNET_SUBMITTED: { icon: Lightbulb, label: 'Lead Magnet Submitted', color: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-800' },
  EMAIL_OPENED: { icon: Mail, label: 'Email Opened', color: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-800' },
  EMAIL_CLICKED: { icon: Link2, label: 'Email Clicked', color: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-800' },

  // Actions
  SEND_EMAIL: { icon: Mail, label: 'Send Email', color: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-800' },
  UPDATE_LEAD: { icon: Edit2, label: 'Update Lead', color: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-800' },
  UPDATE_LEAD_SCORE: { icon: Zap, label: 'Update Score', color: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-800' },

  // Wait
  WAIT_DURATION: { icon: Clock, label: 'Wait', color: 'bg-yellow-100 dark:bg-yellow-900/30', borderColor: 'border-yellow-300 dark:border-yellow-800' },

  // Conditions
  EMAIL_OPENED_CONDITION: { icon: GitBranch, label: 'Email Opened?', color: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-800' },
  EMAIL_CLICKED_CONDITION: { icon: GitBranch, label: 'Email Clicked?', color: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-800' },
  LEAD_STATUS_CONDITION: { icon: GitBranch, label: 'Lead Status?', color: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-800' },
  LEAD_SCORE_CONDITION: { icon: GitBranch, label: 'Lead Score?', color: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-800' },
}

export default function StepNode({ step, onSelect, onDelete, isSelected }) {
  const config = stepTypeConfig[step.type] || {
    icon: Zap,
    label: step.type,
    color: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-700',
  }
  const Icon = config.icon

  // Get display label for step (prefer name field, fallback to description from config)
  const getStepLabel = () => {
    if (step.configuration?.subject) return step.configuration.subject
    if (step.configuration?.fields?.status) return `Status: ${step.configuration.fields.status}`
    if (step.configuration?.duration) return `${step.configuration.duration} ${step.configuration.unit || 'hours'}`
    if (step.configuration?.scoreChange) return `Score: ${step.configuration.scoreChange > 0 ? '+' : ''}${step.configuration.scoreChange}`
    return config.label
  }

  // Get configuration summary for preview
  const getConfigSummary = () => {
    const config = step.configuration || {}
    if (step.type === 'SEND_EMAIL') {
      return config.subject ? `"${config.subject.substring(0, 40)}${config.subject.length > 40 ? '...' : ''}"` : 'No subject set'
    }
    if (step.type === 'UPDATE_LEAD') {
      const updates = []
      if (config.fields?.status) updates.push(`Status: ${config.fields.status}`)
      if (config.fields?.priority) updates.push(`Priority: ${config.fields.priority}`)
      return updates.length > 0 ? updates.join(', ') : 'No fields configured'
    }
    if (step.type === 'UPDATE_LEAD_SCORE') {
      return config.scoreChange ? `${config.scoreChange > 0 ? '+' : ''}${config.scoreChange} points` : 'Not configured'
    }
    if (step.type === 'WAIT_DURATION') {
      return config.duration ? `${config.duration} ${(config.unit || 'HOURS').toLowerCase()}` : 'Not configured'
    }
    return ''
  }

  return (
    <div
      onClick={() => onSelect(step)}
      className={`relative cursor-pointer transition-all w-full sm:w-80 mx-auto ${
        isSelected ? 'ring-2 ring-violet-500' : 'hover:ring-1 hover:ring-violet-300 dark:hover:ring-violet-700'
      }`}
    >
      <div
        className={`rounded-xl border-2 p-4 ${config.color} ${config.borderColor}`}
      >
        <div className="flex items-start gap-3">
          <Icon size={22} className="flex-shrink-0 mt-0.5 text-gray-700 dark:text-gray-300" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {config.label}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
              {getStepLabel()}
            </p>
            {getConfigSummary() && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {getConfigSummary()}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect(step)
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
            title="Edit step"
          >
            <Edit2 size={16} className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm('Delete this step?')) {
                onDelete(step.id)
              }
            }}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
            title="Delete step"
          >
            <Trash2 size={16} className="text-red-600 dark:text-red-400 group-hover:text-red-900 dark:group-hover:text-red-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
