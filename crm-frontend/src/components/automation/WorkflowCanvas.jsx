import { Plus, ArrowDown } from 'lucide-react'
import StepDragDropZone from './StepDragDropZone'
import StepAddModal from './StepAddModal'
import { useState, useEffect } from 'react'

const STEP_TYPES = {
  TRIGGERS: [
    { type: 'LEAD_CREATED', label: 'Lead Created' },
    { type: 'LEAD_MAGNET_SUBMITTED', label: 'Lead Magnet Submitted' },
    { type: 'EMAIL_OPENED', label: 'Email Opened' },
    { type: 'EMAIL_CLICKED', label: 'Email Clicked' },
  ],
  ACTIONS: [
    { type: 'SEND_EMAIL', label: 'Send Email' },
    { type: 'UPDATE_LEAD', label: 'Update Lead' },
    { type: 'UPDATE_LEAD_SCORE', label: 'Update Lead Score' },
  ],
  WAITS: [
    { type: 'WAIT_DURATION', label: 'Wait for Duration' },
  ],
  CONDITIONS: [
    { type: 'EMAIL_OPENED_CONDITION', label: 'Email Opened?' },
    { type: 'EMAIL_CLICKED_CONDITION', label: 'Email Clicked?' },
    { type: 'LEAD_STATUS_CONDITION', label: 'Lead Status?' },
    { type: 'LEAD_SCORE_CONDITION', label: 'Lead Score?' },
  ],
}

export default function WorkflowCanvas({
  steps = [],
  selectedStep,
  onSelectStep,
  onDeleteStep,
  onAddStep,
  onReorderStep,
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const triggerStep = steps.find((s) => s.stepOrder === 1)
  const actionSteps = steps.filter((s) => s.stepOrder > 1)

  const handleAddStep = (stepType) => {
    const newOrder = (Math.max(...steps.map((s) => s.stepOrder || 0), 0) + 1) || 2
    onAddStep({
      type: stepType,
      stepOrder: newOrder,
      configuration: {},
      enabled: true,
    })
    setShowAddModal(false)
  }

  const handleMoveUp = (stepId) => {
    const step = actionSteps.find((s) => s.id === stepId)
    if (!step) return
    const index = actionSteps.findIndex((s) => s.id === stepId)
    if (index <= 0) return

    const targetStep = actionSteps[index - 1]
    onReorderStep(stepId, targetStep.stepOrder)
  }

  const handleMoveDown = (stepId) => {
    const step = actionSteps.find((s) => s.id === stepId)
    if (!step) return
    const index = actionSteps.findIndex((s) => s.id === stepId)
    if (index >= actionSteps.length - 1) return

    const targetStep = actionSteps[index + 1]
    onReorderStep(stepId, targetStep.stepOrder)
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0D1117] pb-8">
      <div className="min-h-full flex flex-col items-center pt-8 px-4 sm:px-8">
        <div className="w-full max-w-3xl">
          {/* Workflow Title */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Workflow
            </h2>
          </div>

          {/* Trigger Step */}
          <div className="mb-8">
            {triggerStep ? (
              <div className="mx-auto w-full sm:w-80">
                {/* Trigger node uses regular StepNode (not draggable) */}
                <div
                  onClick={() => onSelectStep(triggerStep)}
                  className={`relative cursor-pointer transition-all ${
                    selectedStep?.id === triggerStep.id ? 'ring-2 ring-violet-500' : 'hover:ring-1 hover:ring-violet-300 dark:hover:ring-violet-700'
                  }`}
                >
                  <div className="rounded-xl border-2 border-blue-300 dark:border-blue-800 p-4 bg-blue-100 dark:bg-blue-900/30">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.343a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.343 15.657a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM5.343 4.343a1 1 0 00-1.414-1.414L3.222 3.636a1 1 0 001.414 1.414l.707-.707z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Trigger
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 truncate">
                          {triggerStep.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100/50 dark:bg-gray-800/30">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  No trigger selected
                </p>
              </div>
            )}
          </div>

          {/* Action Steps with drag-drop */}
          {actionSteps.length > 0 && (
            <div className="space-y-0">
              {/* Arrow before steps */}
              <div className="flex justify-center py-3">
                <div className="flex flex-col items-center gap-1">
                  <ArrowDown size={20} className="text-gray-400 dark:text-gray-600 animate-bounce" />
                </div>
              </div>

              {/* Draggable steps zone */}
              <StepDragDropZone
                steps={actionSteps}
                selectedStep={selectedStep}
                onSelectStep={onSelectStep}
                onDeleteStep={onDeleteStep}
                onReorderStep={onReorderStep}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isMobile={isMobile}
              />
            </div>
          )}

          {/* Add Step Button */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            {actionSteps.length > 0 && (
              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center gap-1">
                  <ArrowDown size={20} className="text-gray-400 dark:text-gray-600 animate-bounce" />
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                Add Step
              </button>
            </div>
          </div>

          {/* Empty state when no steps */}
          {actionSteps.length === 0 && triggerStep && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add actions, waits, or conditions to build your workflow
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Step Modal */}
      <StepAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectStep={handleAddStep}
        stepTypes={STEP_TYPES}
      />
    </div>
  )
}
