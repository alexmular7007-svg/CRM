import { useState } from 'react'
import DraggableStepNode from './DraggableStepNode'

/**
 * StepDragDropZone - Container for draggable steps with drop indicators
 * Handles drag-over states and drop positioning
 */
export default function StepDragDropZone({
  steps = [],
  selectedStep,
  onSelectStep,
  onDeleteStep,
  onReorderStep,
  onMoveUp,
  onMoveDown,
  isMobile,
}) {
  const [draggedStep, setDraggedStep] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = (e, step) => {
    setDraggedStep(step)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
  }

  const handleDragEnd = (e) => {
    setDraggedStep(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the zone entirely
    if (e.currentTarget === e.target) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedStep) return

    const dragIndex = steps.findIndex((s) => s.id === draggedStep.id)
    if (dragIndex === -1 || dragIndex === dropIndex) return

    // Calculate new order based on drop position
    const currentOrder = draggedStep.stepOrder
    const targetOrder = steps[dropIndex]?.stepOrder

    if (!targetOrder) return

    // Call reorder with the target step order
    onReorderStep(draggedStep.id, targetOrder)
    setDraggedStep(null)
  }

  if (steps.length === 0) {
    return null
  }

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={step.id || idx} onDragOver={handleDragOver}>
          {/* Drop indicator above step */}
          {draggedStep && (
            <div
              onDragEnter={(e) => handleDragEnter(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              className={`h-1 transition-all ${
                dragOverIndex === idx
                  ? 'bg-violet-500 h-2'
                  : 'bg-transparent'
              }`}
            />
          )}

          {/* Arrow connector */}
          <div className="flex justify-center py-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-3 bg-gray-300 dark:bg-gray-600" />
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="w-0.5 h-3 bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>

          {/* Step node */}
          <DraggableStepNode
            step={step}
            onSelect={onSelectStep}
            onDelete={onDeleteStep}
            isSelected={selectedStep?.id === step.id}
            isDragging={draggedStep?.id === step.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isMobile={isMobile}
            canMoveUp={idx > 0}
            canMoveDown={idx < steps.length - 1}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />

          {/* Drop indicator below step */}
          {draggedStep && idx === steps.length - 1 && (
            <div
              onDragEnter={(e) => handleDragEnter(e, idx + 1)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              className={`h-1 transition-all ${
                dragOverIndex === idx + 1
                  ? 'bg-violet-500 h-2'
                  : 'bg-transparent'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
