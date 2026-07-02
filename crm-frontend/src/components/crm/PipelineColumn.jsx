import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import LeadCard from './LeadCard'
import { FiPlus } from 'react-icons/fi'

const statusConfig = {
  LEAD: {
    label: 'Lead',
    color: 'bg-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-300 dark:border-gray-700'
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  PROPOSAL: {
    label: 'Proposal',
    color: 'bg-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  NEGOTIATION: {
    label: 'Negotiation',
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-700'
  },
  WON: {
    label: 'Won',
    color: 'bg-green-500',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700'
  },
  LOST: {
    label: 'Lost',
    color: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700'
  }
}

const PipelineColumn = ({ 
  status, 
  leads, 
  onAddLead, 
  onEditLead, 
  onDeleteLead, 
  onViewLead,
  totalValue 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const config = statusConfig[status]
  const leadCount = leads.length

  const formatCurrency = (value) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px]">
      {/* Column Header */}
      <div className={`
        rounded-t-lg p-4 border-b-2 ${config.borderColor} ${config.lightBg}
        sticky top-0 z-10
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {config.label}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
              {leadCount}
            </span>
          </div>
          
          <button
            onClick={() => onAddLead(status)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            title="Add lead"
          >
            <FiPlus size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {totalValue > 0 && (
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatCurrency(totalValue)}
          </div>
        )}
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 space-y-3 overflow-y-auto rounded-b-lg
          ${config.lightBg}
          ${isOver ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
          transition-all duration-200
        `}
        style={{ minHeight: '200px' }}
      >
        <SortableContext
          items={leads.map(lead => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 text-gray-600 dark:text-gray-400"
            >
              <p className="text-sm">No leads</p>
              <p className="text-xs mt-1">Drag leads here or click + to add</p>
            </motion.div>
          ) : (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={onEditLead}
                onDelete={onDeleteLead}
                onView={onViewLead}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export default PipelineColumn
