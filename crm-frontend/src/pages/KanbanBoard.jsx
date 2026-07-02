import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { taskService } from '../services/taskService'
import { websocketService } from '../services/websocketService'
import KanbanColumn from '../components/kanban/KanbanColumn'
import TaskCard from '../components/kanban/TaskCard'
import TaskDetailsModal from '../components/kanban/TaskDetailsModal'
import TaskFormModal from '../components/kanban/TaskFormModal'
import KanbanFilters from '../components/kanban/KanbanFilters'
import Spinner from '../components/common/Spinner'
import toast from 'react-hot-toast'
import { FiPlus, FiFilter } from 'react-icons/fi'
import { useAutoRefreshOnMemberRemoval } from '../hooks/useAutoRefreshOnMemberRemoval'

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'Review', color: 'bg-yellow-500' },
  { id: 'DONE', title: 'Done', color: 'bg-green-500' },
]

const KanbanBoard = () => {
  const { projectId } = useParams()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    assignee: '',
  })

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(currentWorkspace?.id, queryClient)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Fetch tasks — unwrap paginated response to array
  const { data: rawTasks, isLoading } = useQuery({
    queryKey: ['tasks', projectId, filters, currentWorkspace?.id],
    queryFn: () => taskService.getByProject(projectId, { 
      ...filters,
      workspaceId: currentWorkspace?.id 
    }),
    enabled: !!projectId && !!currentWorkspace?.id,
  })

  const tasks = Array.isArray(rawTasks)
    ? rawTasks
    : rawTasks?.content ?? rawTasks?.data?.content ?? []

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries(['tasks', projectId])
      const previousTasks = queryClient.getQueryData(['tasks', projectId])

      queryClient.setQueryData(['tasks', projectId], (old) => {
        const arr = Array.isArray(old) ? old : old?.content ?? []
        const updated = arr.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
        // Preserve the original shape (paginated or plain array)
        if (Array.isArray(old)) return updated
        return { ...old, content: updated }
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      toast.error('Failed to update task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId])
      toast.success('Task updated successfully')
    },
  })

  // WebSocket real-time updates
  useEffect(() => {
    if (!projectId || !websocketService.connected) return

    const handleTaskUpdate = (message) => {
      queryClient.invalidateQueries(['tasks', projectId])
      toast.success('Task updated by another user')
    }

    // Subscribe to project task updates
    try {
      const subscription = websocketService.client?.subscribe?.(
        `/topic/project/${projectId}/tasks`,
        handleTaskUpdate
      )

      return () => {
        subscription?.unsubscribe()
      }
    } catch (error) {
      console.warn('WebSocket subscription failed:', error)
    }
  }, [projectId, queryClient])

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ taskId, status: newStatus })
    }
  }

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop tasks to update their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <FiFilter />
            Filters
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <KanbanFilters filters={filters} setFilters={setFilters} />
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full pb-6 min-w-max">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-80">
                <TaskCard task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          projectId={projectId}
          workspaceId={currentWorkspace?.id}
        />
      )}

      {isCreateModalOpen && (
        <TaskFormModal
          projectId={projectId}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  )
}

export default KanbanBoard
