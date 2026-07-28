import { useState } from 'react'
import { publicFormSchema } from '../../schemas/leadMagnetSchemas'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

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
    // Clear error for this field
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
    <div className="bg-white dark:bg-[#161B22] rounded-lg shadow-lg p-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {magnet.name}
        </h1>
        {magnet.description && (
          <p className="text-gray-600 dark:text-gray-400">
            {magnet.description}
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Submission failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error.message || 'Please try again later'}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
              errors.name
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#30363D]'
            }`}
            required
          />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
              errors.email
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-[#30363D]'
            }`}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            className="w-full px-4 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company (Optional)
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your Company Inc."
            className="w-full px-4 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-600 dark:text-gray-400 pt-2">
          We respect your privacy. We'll never share your information with anyone else.
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? 'Submitting...' : 'Get Access Now'}
        </button>
      </form>
    </div>
  )
}

export default PublicFormComponent
