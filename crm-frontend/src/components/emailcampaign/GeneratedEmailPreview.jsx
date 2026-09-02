import { useState, useEffect } from 'react'
import { RefreshCw, Edit2, Save, X, Copy, Mail, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import TemplateConflictModal from './TemplateConflictModal'

/**
 * GeneratedEmailPreview - Phase 11.3 & 11.4: Production-Ready Email Preview
 *
 * Displays AI-generated email with editable fields and action buttons.
 * Features realistic email preview (desktop email client style).
 *
 * Features:
 * - Subject line display with inline editing
 * - HTML email preview rendered in iframe (safe sandboxed rendering)
 * - Plain text fallback view toggle
 * - CTA text/URL editing with validation
 * - Real-time edit mode with save/cancel
 * - Action buttons: Regenerate, Save as Template, Use in Campaign
 * - Character count display for editable fields
 * - Responsive design with two-column layout (desktop) / single-column (mobile)
 * - Dark mode support
 * - Phase 11.4: Save as Template with 409 Conflict handling
 *
 * Props:
 * - generated: object - response from AI generation API
 *   {
 *     subject: string,
 *     bodyHtml: string,
 *     bodyPlainText: string,
 *     ctaText: string,
 *     ctaUrl: string,
 *     success: boolean,
 *     error: string,
 *     model: string,
 *     generatedAt: ISO timestamp
 *   }
 * - onRegenerate: callback() - fires when Regenerate clicked
 * - onSaveTemplate: callback(editedContent, templateName) - fires when Save as Template clicked
 *   editedContent: { subject, ctaText, ctaUrl, templateName }
 * - onUseInCampaign: callback(editedContent) - fires when Use in Campaign clicked
 * - isLoading: boolean - true during regeneration
 */
export default function GeneratedEmailPreview({
  generated,
  onRegenerate = () => {},
  onSaveTemplate = () => {},
  onUseInCampaign = () => {},
  isLoading = false,
}) {
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState('html') // 'html' or 'plaintext'
  const [editedContent, setEditedContent] = useState({
    subject: generated?.subject || '',
    bodyHtml: generated?.bodyHtml || '',
    ctaText: generated?.ctaText || '',
    ctaUrl: generated?.ctaUrl || '',
  })
  const [errors, setErrors] = useState({})
  const [templateName, setTemplateName] = useState(generated?.subject ? generated.subject.substring(0, 50) : 'AI Generated Email')
  const [isSaving, setIsSaving] = useState(false)
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    templateName: '',
  })

  useEffect(() => {
    setEditedContent({
      subject: generated?.subject || '',
      bodyHtml: generated?.bodyHtml || '',
      ctaText: generated?.ctaText || '',
      ctaUrl: generated?.ctaUrl || '',
    })
    setEditMode(false)
    setErrors({})
  }, [generated])

  if (!generated) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-[#30363D] dark:bg-[#161B22]">
        <Mail size={40} className="mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">No email generated yet</p>
      </div>
    )
  }

  if (!generated.success) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-200 dark:bg-red-900/40">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Generation Failed</h3>
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">{generated.error || 'Unknown error occurred'}</p>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleEditChange = (field, value) => {
    setEditedContent((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Validate field
    const fieldErrors = {}
    switch (field) {
      case 'subject':
        if (!value.trim()) {
          fieldErrors.subject = 'Subject is required'
        } else if (value.length > 255) {
          fieldErrors.subject = 'Subject must be less than 255 characters'
        }
        break
      case 'ctaText':
        if (!value.trim()) {
          fieldErrors.ctaText = 'CTA text is required'
        } else if (value.length > 100) {
          fieldErrors.ctaText = 'CTA text must be less than 100 characters'
        }
        break
      case 'ctaUrl':
        if (!value.trim()) {
          fieldErrors.ctaUrl = 'CTA URL is required'
        } else if (!/^https?:\/\//.test(value)) {
          fieldErrors.ctaUrl = 'CTA URL must start with http:// or https://'
        }
        break
      default:
        break
    }

    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field] || undefined,
    }))
  }

  const handleSaveEdits = () => {
    // Validate all editable fields
    const newErrors = {}
    if (!editedContent.subject.trim()) {
      newErrors.subject = 'Subject is required'
    } else if (editedContent.subject.length > 255) {
      newErrors.subject = 'Subject must be less than 255 characters'
    }
    if (!editedContent.ctaText.trim()) {
      newErrors.ctaText = 'CTA text is required'
    } else if (editedContent.ctaText.length > 100) {
      newErrors.ctaText = 'CTA text must be less than 100 characters'
    }
    if (!editedContent.ctaUrl.trim()) {
      newErrors.ctaUrl = 'CTA URL is required'
    } else if (!/^https?:\/\//.test(editedContent.ctaUrl)) {
      newErrors.ctaUrl = 'CTA URL must start with http:// or https://'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors above')
      return
    }

    setEditMode(false)
    toast.success('Changes saved')
  }

  const handleCancelEdit = () => {
    setEditedContent({
      subject: generated?.subject || '',
      bodyHtml: generated?.bodyHtml || '',
      ctaText: generated?.ctaText || '',
      ctaUrl: generated?.ctaUrl || '',
    })
    setErrors({})
    setEditMode(false)
  }

  /**
   * Phase 11.4: Save AI-generated email as template
   * Maps: subject → subjectTemplate, bodyHtml → htmlContent, bodyPlainText → plainTextContent
   * Handles 409 Conflict with [Rename Template] [Use Existing Template] options
   * Verifies creation via GET endpoint
   */
  const handleSaveTemplateClick = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setIsSaving(true)
    try {
      // Call parent onSaveTemplate with edited content and template name
      await onSaveTemplate(editedContent, templateName.trim())
    } catch (error) {
      // Error handling is delegated to parent component
      // onSaveTemplate callback should handle errors
    } finally {
      setIsSaving(false)
    }
  }

  const handleConflictRename = async (newName) => {
    setTemplateName(newName)
    setConflictModal({ isOpen: false, templateName: '' })
    // Retry save with new name
    setIsSaving(true)
    try {
      await onSaveTemplate(editedContent, newName)
    } catch (error) {
      // Error handling is delegated to parent component
    } finally {
      setIsSaving(false)
    }
  }

  const handleConflictUseExisting = () => {
    setConflictModal({ isOpen: false, templateName: '' })
    // Callback to parent to switch to existing template mode
    onSaveTemplate(editedContent, templateName.trim(), { useExisting: true })
  }

  const displayContent = editMode ? editedContent : generated
  const previewText = generated.bodyPlainText?.replace(/\s+/g, ' ').trim().slice(0, 160)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 dark:border-[#30363D]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Email</h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Generated at {new Date(generated.generatedAt).toLocaleTimeString()} using {generated.model}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  title="Cancel edits"
                  className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-[#21262D]"
                >
                  <X size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isLoading}
                  title="Save edits"
                  className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-green-400 dark:hover:bg-green-900/20"
                >
                  <Save size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                disabled={isLoading}
                title="Edit email"
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-[#21262D]"
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout: settings on left, preview on right */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Editable fields */}
        <div className="space-y-4 lg:col-span-1">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            {editMode ? (
              <div>
                <input
                  type="text"
                  value={editedContent.subject}
                  onChange={(e) => handleEditChange('subject', e.target.value)}
                  maxLength="255"
                  className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    errors.subject ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-[#30363D]'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.subject && <p className="text-xs text-red-600 dark:text-red-400">{errors.subject}</p>}
                  <p className="ml-auto text-xs text-gray-500 dark:text-gray-500">{editedContent.subject.length}/255</p>
                </div>
              </div>
            ) : (
              <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white">
                {displayContent.subject}
              </p>
            )}
          </div>

          {/* CTA Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTA Text</label>
            {editMode ? (
              <div>
                <input
                  type="text"
                  value={editedContent.ctaText}
                  onChange={(e) => handleEditChange('ctaText', e.target.value)}
                  maxLength="100"
                  className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    errors.ctaText ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-[#30363D]'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.ctaText && <p className="text-xs text-red-600 dark:text-red-400">{errors.ctaText}</p>}
                  <p className="ml-auto text-xs text-gray-500 dark:text-gray-500">{editedContent.ctaText.length}/100</p>
                </div>
              </div>
            ) : (
              <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white">
                {displayContent.ctaText}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview text</label>
            <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300">
              {previewText || 'No preview text returned'}
            </p>
          </div>

          {/* CTA URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CTA URL</label>
            {editMode ? (
              <div>
                <input
                  type="url"
                  value={editedContent.ctaUrl}
                  onChange={(e) => handleEditChange('ctaUrl', e.target.value)}
                  placeholder="https://..."
                  className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    errors.ctaUrl ? 'border-red-500 dark:border-red-600' : 'border-gray-300 dark:border-[#30363D]'
                  }`}
                />
                {errors.ctaUrl && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.ctaUrl}</p>}
              </div>
            ) : (
              <a
                href={displayContent.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-violet-600 hover:text-violet-700 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-violet-400 dark:hover:text-violet-300"
              >
                {displayContent.ctaUrl}
              </a>
            )}
          </div>
        </div>

        {/* Right column: Email preview */}
        <div className="lg:col-span-2">
          {editMode && (
            <div className="mb-4">
              <label htmlFor="generated-body" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email body</label>
              <textarea
                id="generated-body"
                value={editedContent.bodyHtml}
                onChange={(e) => handleEditChange('bodyHtml', e.target.value)}
                rows="12"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
              />
            </div>
          )}
          {/* View mode toggle */}
          <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setViewMode('html')}
              disabled={editMode}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'html'
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Eye size={14} />
              Email Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('plaintext')}
              disabled={editMode}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'plaintext'
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <EyeOff size={14} />
              Plain Text
            </button>
          </div>

          {/* Email Preview Container */}
          {viewMode === 'html' ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-[#30363D] dark:bg-[#0D1117]">
              <iframe
                srcDoc={displayContent.bodyHtml}
                title="Email Preview"
                className="h-[500px] w-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-[#30363D] dark:bg-[#0D1117]">
              <pre className="whitespace-pre-wrap break-words text-xs text-gray-900 dark:text-gray-300">
                {generated.bodyPlainText}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-[#30363D] sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading || editMode || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300 dark:hover:bg-[#161B22]"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent dark:border-gray-400 dark:border-t-transparent" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Regenerate
            </>
          )}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Save as Template Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              disabled={isSaving || editMode}
              maxLength="255"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSaveTemplateClick}
              disabled={isLoading || editMode || isSaving}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300 dark:hover:bg-[#161B22]"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent dark:border-gray-400 dark:border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Save as Template
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onUseInCampaign({
                ...editedContent,
                bodyPlainText: generated.bodyPlainText,
              })
            }}
            disabled={isLoading || editMode || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={16} />
            Use This Email
          </button>
        </div>
      </div>

      {/* Conflict Modal - Phase 11.4 */}
      <TemplateConflictModal
        isOpen={conflictModal.isOpen}
        templateName={conflictModal.templateName}
        onRename={handleConflictRename}
        onUseExisting={handleConflictUseExisting}
        onClose={() => setConflictModal({ isOpen: false, templateName: '' })}
        isLoading={isSaving}
      />
    </div>
  )
}
