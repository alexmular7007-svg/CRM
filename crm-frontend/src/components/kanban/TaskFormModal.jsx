import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { taskService } from '../../services/taskService'
import { aiService } from '../../services/aiService'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiX, FiZap } from 'react-icons/fi'
import Spinner from '../common/Spinner'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useAutoRefreshOnMemberRemoval } from '../../hooks/useAutoRefreshOnMemberRemoval'

const unwrap = (r) => r?.data ?? r

const TaskFormModal = ({ task, projectId, onClose }) => {
  const queryClient = useQueryClient()
  const isEditMode = !!task
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const currentUser = useSelector((s) => s.auth.user)
  const { currentWorkspace } = useSelector((s) => s.workspace)

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(currentWorkspace?.id, queryClient)

  // DEBUG: Log workspace context
  console.warn('═══════════════════════════════════════════════════════════')
  console.warn('TaskFormModal MOUNTED')
  console.warn('currentWorkspace from Redux:', currentWorkspace)
  console.warn('currentWorkspace?.id:', currentWorkspace?.id)
  console.warn('currentUser:', currentUser)
  if (!currentWorkspace) {
    console.error('⚠️  WARNING: currentWorkspace is NULL or UNDEFINED!')
    console.error('   This will cause workspaceId to be null in payload')
    console.error('   Backend validation will fail with 400 Bad Request')
  }
  console.warn('═══════════════════════════════════════════════════════════')
  console.warn('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'MEDIUM',
      status: task?.status || 'TODO',
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      assignedToId: task?.assignedTo?.id || '',
    },
  })

  const watchedTitle = watch('title')
  const watchedDescription = watch('description')
  const watchedDueDate = watch('dueDate')

  // Fetch workspace members to populate assignee dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-search', ''],
    queryFn: async () => {
      const res = await api.get('/users/search?query=&page=0&size=50')
      return unwrap(res)
    },
  })
  const users = Array.isArray(usersData)
    ? usersData
    : usersData?.content ?? []

  // AI priority suggestion
  const { data: aiSuggestion, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-priority', watchedTitle, watchedDescription],
    queryFn: () =>
      aiService.prioritizeTask({
        taskId: task?.id || 0,
        taskTitle: watchedTitle,
        taskDescription: watchedDescription,
        dueDate: watchedDueDate,
        currentPriority: watch('priority'),
        userWorkload: 8,
        overdueTaskCount: 2,
        teamProductivity: 85,
      }),
    enabled: showAISuggestion && watchedTitle.length > 3,
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      // Convert assignedToId: empty string → null, string number → number
      const assignedToId = data.assignedToId
        ? Number(data.assignedToId)
        : null

      // Convert JS Date object → "yyyy-MM-dd" string (what LocalDate expects)
      let dueDate = null
      if (data.dueDate) {
        const d = new Date(data.dueDate)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        dueDate = `${year}-${month}-${day}`
      }

      const payload = {
        ...data,
        workspaceId: currentWorkspace?.id,  // ← Include workspace ID from Redux
        assignedToId,
        dueDate,
        projectId: projectId ? Number(projectId) : undefined,
      }

      // Log the payload being sent
      console.log('═══════════════════════════════════════════════════════════')
      console.log('TASK FORM MUTATION - PAYLOAD BEING SENT')
      console.log('═══════════════════════════════════════════════════════════')
      console.log('Mode:', isEditMode ? 'UPDATE' : 'CREATE')
      console.log('Payload:', JSON.stringify(payload, null, 2))
      console.log('currentWorkspace:', currentWorkspace)
      console.log('workspaceId:', currentWorkspace?.id)
      console.log('═══════════════════════════════════════════════════════════')

      if (isEditMode) return taskService.update(task.id, payload)
      return taskService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId])
      if (task) queryClient.invalidateQueries(['task', task.id])
      toast.success(isEditMode ? 'Task updated' : 'Task created')
      onClose()
    },
    onError: (error) => {
      console.error('Task mutation error:', error)
      console.error('Error response:', error.response)
      toast.error(error.message || 'Failed to save task')
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setValue('priority', aiSuggestion.suggestedPriority)
      toast.success('AI suggestion applied')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold">
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input"
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                className="input min-h-[100px]"
                placeholder="Enter task description"
              />
            </div>

            {/* Priority with AI Suggestion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Priority</label>
                <button
                  type="button"
                  onClick={() => setShowAISuggestion(!showAISuggestion)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <FiZap />
                  AI Suggest
                </button>
              </div>
              <select {...register('priority')} className="input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* AI Suggestion */}
              {showAISuggestion && (
                <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  {aiLoading ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm">Getting AI suggestion...</span>
                    </div>
                  ) : aiSuggestion ? (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        AI suggests: {aiSuggestion.suggestedPriority}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {aiSuggestion.reasoning}
                      </p>
                      <button
                        type="button"
                        onClick={applyAISuggestion}
                        className="text-xs btn-primary py-1 px-3"
                      >
                        Apply Suggestion
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enter a title to get AI suggestions
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">Review</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="label">Due Date</label>
              <DatePicker
                selected={watch('dueDate')}
                onChange={(date) => setValue('dueDate', date)}
                className="input w-full"
                dateFormat="MMM dd, yyyy"
                placeholderText="Select due date"
                minDate={new Date()}
              />
            </div>

            {/* Assignee dropdown */}
            <div>
              <label className="label">Assignee</label>
              <select {...register('assignedToId')} className="input">
                <option value="">— Unassigned —</option>
                {/* Always show current user first */}
                {currentUser && (
                  <option value={currentUser.id}>
                    {currentUser.displayName || currentUser.fullName} (you)
                  </option>
                )}
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.fullName} — {u.email}
                    </option>
                  ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Task' : 'Create Task'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TaskFormModal
