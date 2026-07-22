import { useState, useMemo, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiPlus, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { workspaceService } from '../services/workspaceService'
import WorkspaceCard from '../components/workspace/WorkspaceCard'
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal'
import Spinner from '../components/common/Spinner'

// Skeleton loader for workspace cards
const WorkspaceCardSkeleton = memo(({ index }) => (
  <motion.div
    key={`skeleton-${index}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse border-2 border-gray-100 dark:border-gray-700"
  >
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="mt-auto flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </motion.div>
))

const Workspaces = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [workspaceToEdit, setWorkspaceToEdit] = useState(null)
  const queryClient = useQueryClient()

  // Fetch workspaces with improved caching
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  })

  // Delete workspace mutation
  const deleteMutation = useMutation({
    mutationFn: workspaceService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces'])
      toast.success('Workspace deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workspace')
    },
  })

  const handleDelete = (workspace) => {
    if (window.confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
      deleteMutation.mutate(workspace.id)
    }
  }

  const handleEdit = (workspace) => {
    setWorkspaceToEdit(workspace)
    setShowCreateModal(true)
  }

  const workspaceItems = Array.isArray(workspaces)
    ? workspaces
    : workspaces?.content ?? []

  // Memoize filtered results to prevent unnecessary re-renders
  const filteredWorkspaces = useMemo(() => 
    workspaceItems.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [workspaceItems, searchQuery]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Search Bar */}
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <WorkspaceCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-textPrimary)' }}>Workspaces</h1>
          <p className="mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
            Manage your team workspaces and projects
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <FiPlus size={20} />
          <span>Create Workspace</span>
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Workspaces Grid */}
      {filteredWorkspaces && filteredWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <WorkspaceCard
                workspace={workspace}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FiPlus size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-textPrimary)' }}>
            {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--theme-textSecondary)' }}>
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first workspace to get started'}
          </p>
          {!searchQuery && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Your First Workspace
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setWorkspaceToEdit(null)
        }}
      />
    </div>
  )
}

export default Workspaces
