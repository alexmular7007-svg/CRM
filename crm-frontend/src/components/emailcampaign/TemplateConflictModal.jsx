import { AlertCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * TemplateConflictModal - Phase 11.4: Handle 409 Conflict for duplicate template names
 *
 * Shows when a template with the same name already exists in the workspace.
 * Options: [Rename Template] [Use Existing Template]
 *
 * Props:
 * - isOpen: boolean - modal visibility
 * - templateName: string - conflicting template name
 * - onRename: callback(newName) - fires when user confirms rename with new name
 * - onUseExisting: callback() - fires when user chooses to use existing template
 * - onClose: callback() - fires when modal closes
 * - isLoading: boolean - disable buttons during operation
 */
export default function TemplateConflictModal({
  isOpen,
  templateName,
  onRename = () => {},
  onUseExisting = () => {},
  onClose = () => {},
  isLoading = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-[#161B22]">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Template Already Exists</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              A template named <span className="font-medium">"{templateName}"</span> already exists in this workspace.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-[#0D1117]">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You can rename this template to save it as new, or use the existing template for your campaign.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={() => {
              onUseExisting()
              onClose()
            }}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300 dark:hover:bg-[#21262D]"
          >
            <Zap size={16} />
            Use Existing
          </button>

          <button
            onClick={() => {
              const newName = prompt(
                `Rename template (current: "${templateName}"):`,
                `${templateName} (2)`
              )
              if (newName?.trim()) {
                onRename(newName.trim())
                onClose()
              }
            }}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rename Template
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Your generated email content is preserved and won't be lost.
        </p>
      </div>
    </div>
  )
}
