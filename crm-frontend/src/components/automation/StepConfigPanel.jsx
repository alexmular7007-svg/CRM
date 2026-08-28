import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  getConfigForm,
  SendEmailConfig,
  UpdateLeadConfig,
  UpdateLeadScoreConfig,
  WaitDurationConfig,
  ConditionConfig,
} from './StepConfigForms'

export default function StepConfigPanel({ step, onClose, onSave, isSaving, workspaceId }) {
  const [configuration, setConfiguration] = useState(step?.configuration || {})
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setConfiguration(step?.configuration || {})
  }, [step])

  const ConfigForm = step ? getConfigForm(step.type) : null

  const handleSave = () => {
    onSave({
      ...step,
      configuration,
    })
  }

  if (!step) {
    return isMobile ? null : (
      <div className="hidden md:flex w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161B22] flex-col items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a step to configure</p>
      </div>
    )
  }

  // Mobile drawer version
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden flex items-end">
        <div className="bg-white dark:bg-[#161B22] w-full rounded-t-xl animate-in slide-in-from-bottom-5 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configure Step
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step Type Info */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                Step Type
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{step.type}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Order: {step.stepOrder}
              </p>
            </div>

            {/* Configuration Form */}
            {ConfigForm ? (
              <div className="space-y-4">
                <ConfigForm
                  config={configuration}
                  onChange={setConfiguration}
                  conditionType={step.type}
                  workspaceId={workspaceId}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No configuration available for this step type
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={onClose}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop panel version
  return (
    <div className="hidden md:flex w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161B22] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configure Step</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step Type Info */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
            Step Type
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{step.type}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Order: {step.stepOrder}
          </p>
        </div>

        {/* Configuration Form */}
        {ConfigForm ? (
          <div className="space-y-6">
            <ConfigForm
              config={configuration}
              onChange={setConfiguration}
              conditionType={step.type}
              workspaceId={workspaceId}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No configuration available for this step type
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={onClose}
          className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
