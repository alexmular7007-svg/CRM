import { X, Mail, Edit2, TrendingUp, Clock, GitBranch } from 'lucide-react'
import { useState } from 'react'

const stepIcons = {
  SEND_EMAIL: Mail,
  UPDATE_LEAD: Edit2,
  UPDATE_LEAD_SCORE: TrendingUp,
  WAIT_DURATION: Clock,
  EMAIL_OPENED_CONDITION: GitBranch,
  EMAIL_CLICKED_CONDITION: GitBranch,
  LEAD_STATUS_CONDITION: GitBranch,
  LEAD_SCORE_CONDITION: GitBranch,
}

const stepDescriptions = {
  SEND_EMAIL: 'Send an email to the lead',
  UPDATE_LEAD: 'Update lead properties (status, priority, notes)',
  UPDATE_LEAD_SCORE: 'Adjust lead score by adding or subtracting points',
  WAIT_DURATION: 'Pause workflow for a specified duration',
  EMAIL_OPENED_CONDITION: 'Branch based on whether email was opened',
  EMAIL_CLICKED_CONDITION: 'Branch based on whether email link was clicked',
  LEAD_STATUS_CONDITION: 'Branch based on lead status',
  LEAD_SCORE_CONDITION: 'Branch based on lead score threshold',
}

function StepCard({ type, label, description, icon: Icon, onSelect }) {
  return (
    <button
      onClick={() => onSelect(type)}
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all text-left"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5 text-gray-600 dark:text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
    </button>
  )
}

export default function StepAddModal({ isOpen, onClose, onSelectStep, stepTypes = {} }) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const allSteps = [
    ...stepTypes.ACTIONS?.map(s => ({ ...s, category: 'Actions' })) || [],
    ...stepTypes.WAITS?.map(s => ({ ...s, category: 'Wait' })) || [],
    ...stepTypes.CONDITIONS?.map(s => ({ ...s, category: 'Conditions' })) || [],
  ]

  const filteredSteps = allSteps.filter(step =>
    step.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedSteps = {
    Actions: filteredSteps.filter(s => s.category === 'Actions'),
    Wait: filteredSteps.filter(s => s.category === 'Wait'),
    Conditions: filteredSteps.filter(s => s.category === 'Conditions'),
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#161B22] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Step
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <input
            type="text"
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredSteps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No steps found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSteps).map(([category, steps]) => (
                steps.length > 0 && (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {steps.map((step) => (
                        <StepCard
                          key={step.type}
                          type={step.type}
                          label={step.label}
                          description={stepDescriptions[step.type] || ''}
                          icon={stepIcons[step.type] || Mail}
                          onSelect={(type) => {
                            onSelectStep(type)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
