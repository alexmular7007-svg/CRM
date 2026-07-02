import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../../services/taskService'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  FiX,
  FiCalendar,
  FiUser,
  FiMessageSquare,
  FiActivity,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi'
import Spinner from '../common/Spinner'
import TaskComments from './TaskComments'
import TaskActivity from './TaskActivity'
import TaskFormModal from './TaskFormModal'
import TaskAIAssistant from '../ai/TaskAIAssistant'

const TaskDetailsModal = ({ task, onClose, projectId, workspaceId }) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('comments')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch task details
  const { data: taskDetails, isLoading } = useQuery({
    queryKey: ['task', task.id],
    queryFn: () => taskService.getById(task.id),
    initialData: task,
  })

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: () => taskService.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId])
      toast.success('Task deleted successfully')
      onClose()
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate()
    }
  }

  const tabs = [
    { id: 'comments', label: 'Comments', icon: FiMessageSquare },
    { id: 'activity', label: 'Activity', icon: FiActivity },
  ]

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold">Task Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Edit"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(90vh-80px)]">
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Title */}
                <h3 className="text-2xl font-bold mb-4">{taskDetails.title}</h3>

                {/* Description */}
                {taskDetails.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {taskDetails.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <FiUser />
                      <span>Assignee</span>
                    </div>
                    <p className="font-medium">
                      {taskDetails.assignedTo?.fullName || taskDetails.assignedToName || 'Unassigned'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <FiCalendar />
                      <span>Due Date</span>
                    </div>
                    <p className="font-medium">
                      {taskDetails.dueDate
                        ? format(new Date(taskDetails.dueDate), 'MMM dd, yyyy')
                        : 'No due date'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <TaskAIAssistant task={taskDetails} projectId={projectId} workspaceId={workspaceId} />
                </div>

                {/* Tabs */}
                <div className="border-b dark:border-gray-700 mb-4">
                  <div className="flex gap-4">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <tab.icon />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'comments' && (
                  <TaskComments taskId={task.id} />
                )}
                {activeTab === 'activity' && (
                  <TaskActivity taskId={task.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <TaskFormModal
          task={taskDetails}
          projectId={projectId}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  )
}

export default TaskDetailsModal
