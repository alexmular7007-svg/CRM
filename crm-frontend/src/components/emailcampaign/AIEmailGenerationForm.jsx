import { useState, useEffect } from 'react'
import { AlertCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * AIEmailGenerationForm - Phase 11.3: Production-Ready AI Email Generation UI
 *
 * Professional SaaS form for collecting AI email generation inputs.
 * Integrates with Phase 11.2 backend (/api/emails/generate endpoint).
 *
 * Features:
 * - All required and optional fields with real-time validation
 * - Error display inline with field-specific hints
 * - Loading state with spinner and disabled Generate button
 * - Prevents duplicate requests
 * - User-friendly "Generating..." message
 * - Responsive two-column layout (desktop) / single-column (mobile)
 * - Dark mode support with consistent Tailwind styling
 *
 * Fields:
 * - Campaign Purpose (required) - what is the email about
 * - Target Audience (required) - who should receive it
 * - Product/Service (required) - what are we promoting
 * - Tone (required) - Professional, Friendly, Urgent, Casual, etc.
 * - Offer (optional) - special offer/discount
 * - Key Points (optional) - key selling points
 * - CTA Text (required) - button text
 * - CTA URL (required) - button link with HTTP/HTTPS validation
 * - Language (optional) - email language
 * - Company Name (optional) - for signature
 *
 * Props:
 * - onGenerate: callback(formData) - fires when Generate button clicked with validated form
 * - onCancel: callback() - fires when Cancel clicked
 * - isLoading: boolean - true during generation (disables form)
 */
export default function AIEmailGenerationForm({
  onGenerate = () => {},
  onCancel = () => {},
  isLoading = false,
}) {
  const [form, setForm] = useState({
    purpose: '',
    targetAudience: '',
    productService: '',
    tone: 'Professional',
    offer: '',
    keyPoints: '',
    ctaText: 'Get Started',
    ctaUrl: '',
    language: 'English',
    companyName: '',
  })

  const [tones, setTones] = useState([
    'Professional',
    'Friendly',
    'Urgent',
    'Casual',
    'Formal',
    'Persuasive',
    'Humorous',
  ])
  const [languages] = useState(['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch'])
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Load available tones from backend if not already set
  useEffect(() => {
    const loadTones = async () => {
      try {
        const response = await fetch('/api/emails/tones')
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          setTones(data.data)
        }
      } catch (error) {
        console.error('Error loading tones:', error)
        // Fallback tones already set in state initialization
      }
    }

    loadTones()
  }, [])

  const validateField = (name, value) => {
    const fieldErrors = {}

    switch (name) {
      case 'purpose':
        if (!value.trim()) {
          fieldErrors.purpose = 'Campaign purpose is required'
        } else if (value.length < 5) {
          fieldErrors.purpose = 'Purpose must be at least 5 characters'
        } else if (value.length > 500) {
          fieldErrors.purpose = 'Purpose must be less than 500 characters'
        }
        break

      case 'targetAudience':
        if (!value.trim()) {
          fieldErrors.targetAudience = 'Target audience is required'
        } else if (value.length < 3) {
          fieldErrors.targetAudience = 'Target audience must be at least 3 characters'
        } else if (value.length > 500) {
          fieldErrors.targetAudience = 'Target audience must be less than 500 characters'
        }
        break

      case 'productService':
        if (!value.trim()) {
          fieldErrors.productService = 'Product/Service is required'
        } else if (value.length < 3) {
          fieldErrors.productService = 'Product/Service must be at least 3 characters'
        } else if (value.length > 500) {
          fieldErrors.productService = 'Product/Service must be less than 500 characters'
        }
        break

      case 'tone':
        if (!value) {
          fieldErrors.tone = 'Tone is required'
        }
        break

      case 'offer':
        if (value && value.length > 500) {
          fieldErrors.offer = 'Offer must be less than 500 characters'
        }
        break

      case 'keyPoints':
        if (value && value.length > 500) {
          fieldErrors.keyPoints = 'Key points must be less than 500 characters'
        }
        break

      case 'ctaText':
        if (!value.trim()) {
          fieldErrors.ctaText = 'CTA button text is required'
        } else if (value.length < 2) {
          fieldErrors.ctaText = 'CTA text must be at least 2 characters'
        } else if (value.length > 100) {
          fieldErrors.ctaText = 'CTA text must be less than 100 characters'
        }
        break

      case 'ctaUrl':
        if (!value.trim()) {
          fieldErrors.ctaUrl = 'CTA URL is required'
        } else if (!/^https?:\/\//.test(value)) {
          fieldErrors.ctaUrl = 'CTA URL must start with http:// or https://'
        } else if (value.length > 2000) {
          fieldErrors.ctaUrl = 'CTA URL is too long'
        }
        break

      case 'language':
        if (!value) {
          fieldErrors.language = 'Language is required'
        }
        break

      case 'companyName':
        if (value && value.length > 200) {
          fieldErrors.companyName = 'Company name must be less than 200 characters'
        }
        break

      default:
        break
    }

    return fieldErrors
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate all required fields
    const requiredFields = ['purpose', 'targetAudience', 'productService', 'tone', 'ctaText', 'ctaUrl']
    requiredFields.forEach((field) => {
      const fieldErrors = validateField(field, form[field])
      Object.assign(newErrors, fieldErrors)
    })

    // Validate optional fields that have values
    const optionalFields = ['offer', 'keyPoints', 'language', 'companyName']
    optionalFields.forEach((field) => {
      if (form[field]) {
        const fieldErrors = validateField(field, form[field])
        Object.assign(newErrors, fieldErrors)
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Validate field if it's been touched
    if (touched[name]) {
      const fieldErrors = validateField(name, value)
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name] || undefined,
      }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Validate field on blur
    const fieldErrors = validateField(name, form[name])
    setErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || undefined,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all fields as touched for validation display
    const allFields = Object.keys(form)
    const touchedAll = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    setTouched(touchedAll)

    if (!validateForm()) {
      toast.error('Please fix the errors above')
      return
    }

    setIsGenerating(true)

    // Call parent handler
    try {
      onGenerate(form)
    } catch (error) {
      console.error('Error in onGenerate callback:', error)
      toast.error('An error occurred during generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const fieldClass =
    'w-full px-3 py-2 rounded-lg border bg-white text-gray-900 transition-colors dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500'
  const fieldErrorClass = 'border-red-500 dark:border-red-600'
  const fieldNormalClass =
    'border-gray-300 dark:border-[#30363D] focus:border-violet-500 dark:focus:border-violet-500'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'
  const errorTextClass = 'mt-1 text-xs text-red-600 dark:text-red-400'

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 dark:border-[#30363D]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Zap size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Email with AI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a professional email in seconds
              </p>
            </div>
          </div>
        </div>

        {/* FORM CONTAINER WITH LOADING OVERLAY */}
        <div className="relative">
          {/* Two-column layout for desktop, single for mobile */}
          <div className={`grid gap-6 lg:grid-cols-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Left column */}
          <div className="space-y-5">
            {/* Campaign Purpose */}
            <div>
              <label htmlFor="purpose" className={labelClass}>
                Campaign Purpose *
              </label>
              <input
                id="purpose"
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Promote our AI CRM"
                maxLength="500"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.purpose ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.purpose && <p className={errorTextClass}>{errors.purpose}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {form.purpose.length}/500 characters
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <label htmlFor="targetAudience" className={labelClass}>
                Target Audience *
              </label>
              <input
                id="targetAudience"
                type="text"
                name="targetAudience"
                value={form.targetAudience}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Startup founders"
                maxLength="500"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.targetAudience ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.targetAudience && <p className={errorTextClass}>{errors.targetAudience}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {form.targetAudience.length}/500 characters
              </p>
            </div>

            {/* Product/Service */}
            <div>
              <label htmlFor="productService" className={labelClass}>
                Product / Service *
              </label>
              <input
                id="productService"
                type="text"
                name="productService"
                value={form.productService}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., AI-powered CRM"
                maxLength="500"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.productService ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.productService && <p className={errorTextClass}>{errors.productService}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {form.productService.length}/500 characters
              </p>
            </div>

            {/* Tone */}
            <div>
              <label htmlFor="tone" className={labelClass}>
                Tone *
              </label>
              <select
                id="tone"
                name="tone"
                value={form.tone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.tone ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tones.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
              {errors.tone && <p className={errorTextClass}>{errors.tone}</p>}
            </div>

            {/* Offer */}
            <div>
              <label htmlFor="offer" className={labelClass}>
                Offer
              </label>
              <input
                id="offer"
                type="text"
                name="offer"
                value={form.offer}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., 14-day free trial"
                maxLength="500"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.offer ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.offer && <p className={errorTextClass}>{errors.offer}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Optional • {form.offer.length}/500</p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Key Points */}
            <div>
              <label htmlFor="keyPoints" className={labelClass}>
                Key Points
              </label>
              <textarea
                id="keyPoints"
                name="keyPoints"
                value={form.keyPoints}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Manage leads, campaigns and analytics"
                maxLength="500"
                rows="2"
                disabled={isLoading}
                className={`${fieldClass} resize-none ${
                  errors.keyPoints ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.keyPoints && <p className={errorTextClass}>{errors.keyPoints}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Optional • {form.keyPoints.length}/500</p>
            </div>

            {/* CTA Text */}
            <div>
              <label htmlFor="ctaText" className={labelClass}>
                CTA Text *
              </label>
              <input
                id="ctaText"
                type="text"
                name="ctaText"
                value={form.ctaText}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Start Free Trial"
                maxLength="100"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.ctaText ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.ctaText && <p className={errorTextClass}>{errors.ctaText}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{form.ctaText.length}/100</p>
            </div>

            {/* CTA URL */}
            <div>
              <label htmlFor="ctaUrl" className={labelClass}>
                CTA URL *
              </label>
              <input
                id="ctaUrl"
                type="url"
                name="ctaUrl"
                value={form.ctaUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://example.com"
                disabled={isLoading}
                className={`${fieldClass} ${
                  errors.ctaUrl ? fieldErrorClass : fieldNormalClass
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.ctaUrl && <p className={errorTextClass}>{errors.ctaUrl}</p>}
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className={labelClass}>
                Language
              </label>
              <select
                id="language"
                name="language"
                value={form.language}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
                className={`${fieldClass} ${fieldNormalClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className={labelClass}>
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., TechCorp"
                maxLength="200"
                disabled={isLoading}
                className={`${fieldClass} ${fieldNormalClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.companyName && <p className={errorTextClass}>{errors.companyName}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Optional • {form.companyName.length}/200</p>
            </div>
          </div>
        </div>

          {/* LOADING OVERLAY - NEW */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#0d1117]/80 rounded-lg backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                {/* Spinner */}
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-[#30363D] border-t-blue-500 rounded-full animate-spin"></div>
                {/* Loading Text */}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generating email...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-[#30363D] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300 dark:hover:bg-[#161B22]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit({ preventDefault: () => {} })}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={16} />
                Generate Email
              </>
            )}
          </button>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          * Required fields. AI will generate a professional marketing email based on your inputs within seconds.
        </p>
      </div>
    </div>
  )
}

