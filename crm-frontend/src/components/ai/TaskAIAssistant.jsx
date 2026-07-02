import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiCalendar, FiCheckCircle, FiList, FiShield, FiZap } from 'react-icons/fi'
import { aiService } from '../../services/aiService'
import { taskService } from '../../services/taskService'
import AIResponseCard from './AIResponseCard'

const normalizeSuggestions = (response) => (
  response?.actionRecommendations?.length ? response.actionRecommendations : response?.suggestions || []
)

const TaskAIAssistant = ({ task, projectId, workspaceId }) => {
  const queryClient = useQueryClient()

  const priorityPayload = useMemo(() => ({
    taskId: task.id,
    taskTitle: task.title,
    taskDescription: task.description,
    dueDate: task.dueDate,
    currentPriority: task.priority,
    userWorkload: 0,
    overdueTaskCount: 0,
    teamProductivity: 0,
  }), [task])

  const priorityQuery = useQuery({
    queryKey: ['ai', 'task-priority', task.id, task.updatedAt],
    queryFn: () => aiService.prioritizeTask(priorityPayload),
    staleTime: 5 * 60 * 1000,
  })

  const deadlineQuery = useQuery({
    queryKey: ['ai', 'task-deadline', task.id, task.updatedAt],
    queryFn: () => aiService.predictDeadline({
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      taskComplexity: task.priority,
      averageCompletionDays: 0,
      userProductivityScore: 0,
      currentWorkload: 0,
    }),
    staleTime: 5 * 60 * 1000,
  })

  const subtaskQuery = useQuery({
    queryKey: ['ai', 'task-subtasks', task.id, task.updatedAt],
    queryFn: () => aiService.getSmartReplies({
      message: `Break this task into implementation subtasks: ${task.title}`,
      context: `Task description: ${task.description || 'No description'}\nPriority: ${task.priority}\nStatus: ${task.status}`,
      conversationHistory: '',
      suggestionCount: 5,
    }),
    staleTime: 5 * 60 * 1000,
  })

  const createSubtasksMutation = useMutation({
    mutationFn: async (subtasks) => Promise.all(subtasks.map((title) => taskService.create({
      title: title.replace(/^[-*\d.\s]+/, '').slice(0, 240),
      description: `AI-generated subtask for: ${task.title}`,
      status: 'TODO',
      priority: task.priority || 'MEDIUM',
      projectId,
      workspaceId: workspaceId,  // ← Include workspace ID from parent
    }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] })
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('AI subtasks saved to the project')
    },
    onError: (error) => toast.error(error.message || 'Failed to save AI subtasks'),
  })

  const priority = priorityQuery.data
  const deadline = deadlineQuery.data
  const subtasks = normalizeSuggestions(subtaskQuery.data)

  const markdown = [
    priority && `### Priority and risk\n**Suggested priority:** ${priority.suggestedPriority}\n\n**Risk score:** ${priority.riskScore}/100\n\n${priority.reasoning}\n\n**Recommendation:** ${priority.recommendation}`,
    deadline && `### Deadline suggestion\n**Suggested deadline:** ${deadline.suggestedDeadline || 'No date suggested'}\n\n**Estimated effort:** ${deadline.estimatedDays || 0} days\n\n**Risk:** ${deadline.riskAssessment}\n\n${deadline.recommendation}`,
    subtasks.length > 0 && `### Generated subtasks\n${subtasks.map((item) => `- ${item}`).join('\n')}`,
  ].filter(Boolean).join('\n\n')

  const handleRegenerate = async () => {
    try {
      // Force refetch even if stale time hasn't passed
      await Promise.all([
        priorityQuery.refetch(),
        deadlineQuery.refetch(),
        subtaskQuery.refetch(),
      ])
      toast.success('AI suggestions regenerated')
    } catch (error) {
      console.error('Regenerate error:', error)
      toast.error('Failed to regenerate suggestions')
    }
  }

  return (
    <AIResponseCard
      title="AI Task Assistant"
      subtitle="Priority, risk, deadline, summary, and generated subtasks"
      loading={priorityQuery.isLoading || deadlineQuery.isLoading || subtaskQuery.isLoading}
      error={priorityQuery.error?.message || deadlineQuery.error?.message || subtaskQuery.error?.message}
      markdown={markdown}
      confidence={deadline?.confidenceLevel}
      onRetry={handleRegenerate}
      actions={(
        <>
          {priority?.suggestedPriority && (
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => {
                taskService.update(task.id, { priority: priority.suggestedPriority, workspaceId })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
                    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
                    toast.success('AI priority applied')
                  })
                  .catch((err) => {
                    console.error('Priority update error:', err)
                    toast.error(err.message || 'Failed to apply priority')
                  })
              }}
            >
              <FiShield />
              Apply priority
            </button>
          )}
          {deadline?.suggestedDeadline && (
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => {
                // Normalize the AI date string to yyyy-MM-dd for the backend LocalDate
                const raw = deadline.suggestedDeadline
                let dateStr = raw
                if (raw && raw.includes('T')) {
                  dateStr = raw.split('T')[0]
                } else if (raw && raw.match(/^\d{4}-\d{2}-\d{2}/)) {
                  dateStr = raw.slice(0, 10)
                }
                taskService.update(task.id, { dueDate: dateStr, workspaceId })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
                    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
                    toast.success('AI deadline applied')
                  })
                  .catch((err) => {
                    console.error('Deadline update error:', err)
                    toast.error(err.message || 'Failed to apply deadline')
                  })
              }}
            >
              <FiCalendar />
              Apply deadline
            </button>
          )}
          {subtasks.length > 0 && projectId && (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              disabled={createSubtasksMutation.isPending}
              onClick={() => createSubtasksMutation.mutate(subtasks)}
            >
              <FiList />
              Save subtasks
            </button>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
            <FiCheckCircle />
            Gemini-backed
          </span>
        </>
      )}
    />
  )
}

export default TaskAIAssistant
