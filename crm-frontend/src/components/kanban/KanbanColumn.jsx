import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import clsx from 'clsx'

const KanbanColumn = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx('w-3 h-3 rounded-full', column.color)} />
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={clsx('h-full transition-all', column.color)}
            style={{ width: `${Math.min((tasks.length / 10) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 rounded-lg p-4 transition-colors min-h-[200px]',
          isOver
            ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-400 border-dashed'
            : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p className="text-sm">No tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export default KanbanColumn
