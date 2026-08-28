import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Lightbulb, Mail, Link2 } from 'lucide-react'
import TriggerCard from './TriggerCard'

/**
 * Automation Trigger Selection - Step 1 of 3
 * 
 * Allows user to select when the automation should trigger.
 * Triggers are sourced from backend AutomationTriggerType enum:
 * - LEAD_CREATED
 * - LEAD_MAGNET_SUBMITTED
 * - EMAIL_OPENED
 * - EMAIL_CLICKED
 */
export default function AutomationTriggerSelection() {
  const navigate = useNavigate()
  const [selectedTrigger, setSelectedTrigger] = useState(null)

  const triggers = [
    {
      id: 'LEAD_CREATED',
      icon: Zap,
      title: 'Lead Created',
      description: 'A new lead is created in the CRM.',
    },
    {
      id: 'LEAD_MAGNET_SUBMITTED',
      icon: Lightbulb,
      title: 'Lead Magnet Submitted',
      description: 'A visitor submits a lead magnet form.',
    },
    {
      id: 'EMAIL_OPENED',
      icon: Mail,
      title: 'Email Opened',
      description: 'A recipient opens an email.',
    },
    {
      id: 'EMAIL_CLICKED',
      icon: Link2,
      title: 'Email Clicked',
      description: 'A recipient clicks a link in an email.',
    },
  ]

  const handleContinue = () => {
    if (!selectedTrigger) return

    // Navigate to next step (steps builder) with trigger type as state
    // For now, navigate to automation create with trigger pre-selected
    navigate('/marketing/automations/create', {
      state: { triggerType: selectedTrigger },
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/marketing/automations')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Automation
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step 1 of 3
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl p-6">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white font-semibold">
            1
          </div>
          <div className="h-1 w-12 bg-gray-200 dark:bg-[#30363D]" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 dark:border-[#30363D] dark:text-gray-500 font-semibold">
            2
          </div>
          <div className="h-1 w-12 bg-gray-200 dark:bg-[#30363D]" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 dark:border-[#30363D] dark:text-gray-500 font-semibold">
            3
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Trigger
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            When should this automation start?
          </p>
        </div>

        {/* Trigger Cards Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {triggers.map((trigger) => (
            <TriggerCard
              key={trigger.id}
              icon={trigger.icon}
              title={trigger.title}
              description={trigger.description}
              isSelected={selectedTrigger === trigger.id}
              onClick={() => setSelectedTrigger(trigger.id)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-[#30363D]">
          <button
            onClick={() => navigate('/marketing/automations')}
            className="rounded-lg border border-gray-300 dark:border-[#30363D] px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#161B22] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedTrigger}
            className="rounded-lg bg-violet-600 px-6 py-2 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Validation Message */}
        {!selectedTrigger && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Please select a trigger to continue
          </p>
        )}
      </div>
    </div>
  )
}
