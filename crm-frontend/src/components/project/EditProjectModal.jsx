import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { projectService } from '../../services/projectService'
import Modal from '../common/Modal'
import FormInput from '../auth/FormInput'

const projectColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
]

const projectStatuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']),
  color: z.string(),
})

const EditProjectModal = ({ isOpen, onClose, project, workspaceId }) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
      color: '#3b82f6',
    },
  })

  // Populate form when project is loaded
  useEffect(() => {
    if (project) {
      reset({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        color: project.color || '#3b82f6',
      })
    }
  }, [project, reset])

  const selectedColor = watch('color')

  const updateMutation = useMutation({
    mutationFn: (data) =>
      projectService.update(project.id, {
        ...data,
        workspaceId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', workspaceId])
      toast.success('Project updated successfully!')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project')
    },
  })

  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }

  const handleClose = () => {
    if (!updateMutation.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Project" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormInput
          label="Project Name"
          placeholder="e.g., Mobile App Development"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="What's this project about?"
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            {...register('status')}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
          >
            {projectStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Project Color
          </label>
          <div className="flex items-center space-x-3">
            {projectColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  selectedColor === color
                    ? 'ring-4 ring-offset-2 ring-blue-500 scale-110'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={updateMutation.isPending}
            whileHover={{ scale: updateMutation.isPending ? 1 : 1.02 }}
            whileTap={{ scale: updateMutation.isPending ? 1 : 0.98 }}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {updateMutation.isPending ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Project</span>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  )
}

export default EditProjectModal
