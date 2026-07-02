import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { createWorkspaceSchema } from '../../schemas/workspaceSchemas'
import { workspaceService } from '../../services/workspaceService'
import Modal from '../common/Modal'
import FormInput from '../auth/FormInput'

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: workspaceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
      toast.success('Workspace created successfully!')
      reset()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workspace')
    },
  })

  const onSubmit = (data) => {
    createMutation.mutate(data)
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Workspace" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Workspace Name */}
        <FormInput
          label="Workspace Name"
          placeholder="e.g., Engineering Team"
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
            placeholder="What's this workspace for?"
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="px-6 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={createMutation.isPending}
            whileHover={{ scale: createMutation.isPending ? 1 : 1.02 }}
            whileTap={{ scale: createMutation.isPending ? 1 : 0.98 }}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {createMutation.isPending ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Workspace</span>
            )}
          </motion.button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateWorkspaceModal
