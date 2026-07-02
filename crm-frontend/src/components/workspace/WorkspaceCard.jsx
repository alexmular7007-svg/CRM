import { motion } from 'framer-motion'
import { FiUsers, FiFolderPlus, FiMoreVertical, FiEdit2, FiTrash2, FiSettings } from 'react-icons/fi'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCurrentWorkspace } from '../../store/slices/workspaceSlice'

const WorkspaceCard = ({ workspace, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleClick = () => {
    dispatch(setCurrentWorkspace(workspace))
    navigate(`/workspaces/${workspace.id}/projects`)
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onEdit(workspace)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onDelete(workspace)
  }

  const handleSettings = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    dispatch(setCurrentWorkspace(workspace))
    navigate(`/workspaces/${workspace.id}/settings`)
  }
  
  // Members icon also opens Settings page
  const handleMembers = (e) => {
    e.stopPropagation()
    dispatch(setCurrentWorkspace(workspace))
    navigate(`/workspaces/${workspace.id}/settings`)
  }

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className="relative group cursor-pointer"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {workspace.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {workspace.memberCount || 0} members
              </p>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
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
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <FiEdit2 size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <FiSettings size={16} />
                  <span>Settings</span>
                </button>
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
        {workspace.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {workspace.description}
          </p>
        )}

        {/* Stats and Members Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <FiFolderPlus size={16} />
              <span>{workspace.projectCount || 0} projects</span>
            </div>
            <button
              onClick={handleMembers}
              className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <FiUsers size={16} />
              <span>{workspace.memberCount || 0} members</span>
            </button>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </motion.div>
  )
}

export default WorkspaceCard
