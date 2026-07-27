import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, 
  FiClock, FiEdit2, FiTrash2, FiMoreVertical, FiTag, FiCheckCircle 
} from 'react-icons/fi'
import { format } from 'date-fns'
import { useState, useRef, useEffect } from 'react'

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const LeadCard = ({ lead, onEdit, onDelete, onView, isDragging }) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 
        dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md 
        transition-all duration-200 group
        ${isSortableDragging ? 'shadow-2xl ring-2 ring-primary-500' : ''}
      `}
      onClick={() => onView(lead)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
            {lead.name}
          </h3>
          {lead.company && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <FiBriefcase className="mr-1 flex-shrink-0" size={14} />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>
        
        {/* Converted Badge */}
        {lead.converted && (
          <div className="ml-2 flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
            <FiCheckCircle className="text-green-600 dark:text-green-400" size={14} />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Converted</span>
          </div>
        )}
        
        <div className="relative ml-2" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiMoreVertical size={16} />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(lead)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
              >
                <FiEdit2 size={14} />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(lead.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
              >
                <FiTrash2 size={14} />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          <FiMail className="mr-1.5 flex-shrink-0" size={12} />
          <span className="truncate">{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <FiPhone className="mr-1.5 flex-shrink-0" size={12} />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Deal Value */}
      {lead.dealValue > 0 && (
        <div className="flex items-center justify-between mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="flex items-center text-green-700 dark:text-green-400">
            <FiDollarSign className="mr-1" size={14} />
            <span className="text-sm font-semibold">{formatCurrency(lead.dealValue)}</span>
          </div>
        </div>
      )}

      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[lead.priority]}`}>
          {lead.priority}
        </span>
        
        {lead.expectedCloseDate && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <FiClock className="mr-1" size={12} />
            {format(new Date(lead.expectedCloseDate), 'MMM dd')}
          </div>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <FiTag size={10} className="mr-1" />
              {tag}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{lead.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Assigned To */}
      {lead.assignedTo && (
        <div className="flex items-center pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
              {lead.assignedTo.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {lead.assignedTo.fullName}
            </span>
          </div>
        </div>
      )}

      {/* Last Activity */}
      {lead.lastActivityAt && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Last activity: {format(new Date(lead.lastActivityAt), 'MMM dd, HH:mm')}
        </div>
      )}
    </motion.div>
  )
}

export default LeadCard
