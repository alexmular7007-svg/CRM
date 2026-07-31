import { useState } from 'react'
import { publicFormSchema } from '../../schemas/leadMagnetSchemas'
import { AlertCircle, CheckCircle } from 'lucide-react'

const PublicFormComponent = ({ magnet, onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const validated = publicFormSchema.parse(formData)
      onSubmit(validated)
    } catch (err) {
      if (err.errors) {
        const errorMap = {}
        err.errors.forEach((e) => {
          errorMap[e.path[0]] = e.message
        })
        setErrors(errorMap)
      }
    }
  }

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Submission failed</p>
            <p className="text-sm text-red-700 mt-1">
              {error?.message || 'Please try again later'}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 transition-colors ${
              errors.name
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            required
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-400 transition-colors ${
              errors.email
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-colors"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Company (Optional)
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your Company Inc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-colors"
          />
        </div>

        {/* Privacy Note */}
        <div className="flex gap-2 text-xs text-gray-600">
          <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
          <span>We respect your privacy. Your information will never be shared.</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </span>
          ) : (
            'Claim Offer'
          )}
        </button>
      </form>
    </div>
  )
}

export default PublicFormComponent
