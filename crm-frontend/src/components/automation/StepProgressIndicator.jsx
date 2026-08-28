/**
 * StepProgressIndicator - Shows progress through multi-step automation creation
 * 
 * Props:
 * - currentStep: 1, 2, or 3
 * - steps: Array of step definitions with labels
 */
export default function StepProgressIndicator({ currentStep = 1, steps = [] }) {
  if (steps.length === 0) {
    steps = [
      { label: 'Trigger', number: 1 },
      { label: 'Steps', number: 2 },
      { label: 'Review', number: 3 },
    ]
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-2 sm:gap-4">
          {/* Step Circle */}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm ${
              currentStep >= step.number
                ? 'bg-violet-600 text-white'
                : 'border-2 border-gray-300 dark:border-[#30363D] text-gray-500 dark:text-gray-400'
            }`}
          >
            {step.number}
          </div>

          {/* Step Label (hidden on mobile) */}
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
            {step.label}
          </span>

          {/* Connector Line (not after last step) */}
          {index < steps.length - 1 && (
            <div
              className={`hidden sm:block h-1 w-8 mx-1 ${
                currentStep > step.number
                  ? 'bg-violet-600'
                  : 'bg-gray-200 dark:bg-[#30363D]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
