import { Check } from 'lucide-react'

/**
 * TriggerCard - Reusable card component for displaying automation triggers
 * 
 * Props:
 * - icon: React component (lucide-react icon)
 * - title: Trigger name (e.g., "Lead Created")
 * - description: What this trigger does
 * - isSelected: Boolean indicating if this trigger is selected
 * - onClick: Callback when card is clicked
 */
export default function TriggerCard({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-6 rounded-lg border-2 text-left transition-all ${
        isSelected
          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-[#30363D] dark:bg-[#161B22] dark:hover:border-[#40494D]'
      }`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
          <Check size={16} className="text-white" />
        </div>
      )}

      {/* Icon */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#21262D]">
        <Icon size={24} className="text-gray-600 dark:text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </button>
  )
}
