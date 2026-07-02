import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiPlus, FiSearch, FiArrowLeft, FiGrid, FiList } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { projectService } from '../services/projectService'
import { workspaceService } from '../services/workspaceService'
import ProjectCard from '../components/project/ProjectCard'
import CreateProjectModal from '../components/project/CreateProjectModal'
import EditProjectModal from '../components/project/EditProjectModal'
import Spinner from '../components/common/Spinner'

const Projects = () => {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showArchived, setShowArchived] = useState(false) // Toggle between active and archived

  // Fetch workspace details
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId && !currentWorkspace,
  })

  // Fetch projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => projectService.getAll(workspaceId),
    enabled: !!workspaceId,
  })

  // Unwrap paginated response → plain array
  const projects = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.content ?? projectsData?.data?.content ?? []

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', workspaceId])
      toast.success('Project deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete project')
    },
  })

  // Archive project mutation
  const archiveMutation = useMutation({
    mutationFn: projectService.archive,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', workspaceId])
      toast.success('Project archived successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to archive project')
    },
  })

  // Unarchive project mutation
  const unarchiveMutation = useMutation({
    mutationFn: projectService.unarchive,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', workspaceId])
      toast.success('Project unarchived successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unarchive project')
    },
  })

  const handleDelete = (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteMutation.mutate(project.id)
    }
  }

  const handleArchive = (project) => {
    if (window.confirm(`Archive "${project.name}"?`)) {
      archiveMutation.mutate(project.id)
    }
  }

  const handleUnarchive = (project) => {
    if (window.confirm(`Unarchive "${project.name}"?`)) {
      unarchiveMutation.mutate(project.id)
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  // Filter projects by search query and archived status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = (project.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchiveFilter = showArchived ? project.archived : !project.archived
    return matchesSearch && matchesArchiveFilter
  })

  const workspaceName = currentWorkspace?.name || workspace?.name || 'Workspace'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/workspaces')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-textPrimary)' }}>
              {workspaceName} Projects
            </h1>
            <p className="mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
              Manage projects and track progress
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <FiPlus size={20} />
          <span>Create Project</span>
        </motion.button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <FiGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <FiList size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            showArchived
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-300'
          }`}
        >
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProjectCard
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
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
            {searchQuery ? 'No projects found' : showArchived ? 'No archived projects' : 'No projects yet'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--theme-textSecondary)' }}>
            {searchQuery
              ? 'Try adjusting your search query'
              : showArchived
              ? 'Archive projects using the three-dot menu to see them here'
              : 'Create your first project to get started'}
          </p>
          {!searchQuery && !showArchived && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Your First Project
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={workspaceId}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingProject(null)
        }}
        project={editingProject}
        workspaceId={workspaceId}
      />
    </div>
  )
}

export default Projects
