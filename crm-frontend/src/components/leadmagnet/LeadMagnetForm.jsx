import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { leadMagnetService } from '../../services/leadMagnetService'
import { createLeadMagnetSchema, updateLeadMagnetSchema } from '../../schemas/leadMagnetSchemas'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'

const LeadMagnetForm = ({ magnet, onSuccess }) => {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const slugEditedRef = useRef(false)

  const [formData, setFormData] = useState({
    name: magnet?.name || '',
    slug: magnet?.slug || '',
    description: magnet?.description || '',
    active: magnet?.active !== false,
  })

  const [slugValidation, setSlugValidation] = useState(null)
  const [isValidatingSlug, setIsValidatingSlug] = useState(false)

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEditedRef.current && formData.name) {
      const generated = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)
      setFormData(prev => ({ ...prev, slug: generated }))
    }
  }, [formData.name])

  // Validate slug uniqueness
  useEffect(() => {
    if (!formData.slug) {
      setSlugValidation(null)
      return
    }

    const validateSlugAsync = async () => {
      setIsValidatingSlug(true)
      try {
        await leadMagnetService.validateSlug(
          currentWorkspace?.id,
          formData.slug,
          magnet?.id
        )
        setSlugValidation({ valid: true, message: 'Slug is available' })
      } catch (error) {
        setSlugValidation({ valid: false, message: 'Slug already in use' })
      } finally {
        setIsValidatingSlug(false)
      }
    }

    // Debounce validation
    const timeout = setTimeout(validateSlugAsync, 500)
    return () => clearTimeout(timeout)
  }, [formData.slug, currentWorkspace?.id, magnet?.id])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) =>
      leadMagnetService.createLeadMagnet(currentWorkspace?.id, data),
    onSuccess: () => {
      toast.success('Campaign created successfully')
      queryClient.invalidateQueries({ queryKey: ['lead-magnets'] })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create campaign')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) =>
      leadMagnetService.updateLeadMagnet(currentWorkspace?.id, magnet.id, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully')
      queryClient.invalidateQueries({ queryKey: ['lead-magnets'] })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update campaign')
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate slug first
    if (slugValidation && !slugValidation.valid) {
      toast.error('Please choose an available slug')
      return
    }

    if (isValidatingSlug) {
      toast.error('Please wait for slug validation to complete')
      return
    }

    try {
      const schema = magnet ? updateLeadMagnetSchema : createLeadMagnetSchema
      const validated = schema.parse(formData)

      if (magnet) {
        updateMutation.mutate(validated)
      } else {
        createMutation.mutate(validated)
      }
    } catch (error) {
      if (error.errors) {
        error.errors.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        toast.error('Validation failed')
      }
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'slug') {
      slugEditedRef.current = true
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isValid = formData.name && formData.slug && (!formData.slug || slugValidation?.valid)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Campaign Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Free CRM Guide"
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.name.length}/255
        </p>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Slug *
        </label>
        <div className="relative">
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="free-crm-guide"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
            required
          />
          {formData.slug && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidatingSlug ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-violet-600" />
              ) : slugValidation?.valid ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <X size={16} className="text-red-600" />
              )}
            </div>
          )}
        </div>
        {slugValidation && (
          <p className={`text-xs mt-1 ${slugValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
            {slugValidation.message}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your lead magnet..."
          maxLength={1000}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.description.length}/1000
        </p>
      </div>

      {/* Status Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="active"
          id="active"
          checked={formData.active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {isLoading ? 'Saving...' : magnet ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default LeadMagnetForm
