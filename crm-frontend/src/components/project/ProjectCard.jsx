import { motion } from 'framer-motion'
import { FiCalendar, FiUsers, FiMoreVertical, FiEdit2, FiTrash2, FiArchive, FiTrello } from 'react-icons/fi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCurrentProject } from '../../store/slices/workspaceSlice'
import { format } from 'date-fns'

const statusColors = {
  PLANNING: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ON_HOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const ProjectCard = ({ project, onEdit, onDelete, onArchive, onUnarchive }) => {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch(setCurrentProject(project))
    navigate(`/projects/${project.id}/kanban`)
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit(project)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete(project)
  }

  const handleArchive = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onArchive(project)
  }

  const handleUnarchive = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    if (onUnarchive) onUnarchive(project)
  }

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className="relative group cursor-pointer"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-xl">
        {/* Color Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: project.color || '#3b82f6' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: project.color || '#3b82f6' }}
            >
              {project.icon || project.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-snug">
                {project.name}
              </h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[project.status] || statusColors.PLANNING}`}>
                {project.status || 'PLANNING'}
              </span>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <FiMoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-10"
              >
                {!project.archived && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <FiEdit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleArchive}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <FiArchive size={16} />
                      <span>Archive</span>
                    </button>
                  </>
                )}
                {project.archived && (
                  <button
                    onClick={handleUnarchive}
                    className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                  >
                    <FiArchive size={16} />
                    <span>Unarchive</span>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <FiTrash2 size={16} />
                  <span>Delete</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {project.endDate && (
              <div className="flex items-center space-x-1">
                <FiCalendar size={16} />
                <span>{format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <FiUsers size={16} />
              <span>{project.memberCount || 0}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <FiTrello size={16} />
            <span>Kanban</span>
          </button>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </motion.div>
  )
}

export default ProjectCard
