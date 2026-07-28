import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import { leadMagnetService } from '../services/leadMagnetService'
import { Plus, Search, Filter, ChevronDown, Eye, Edit2, Copy, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import LeadMagnetModal from '../components/leadmagnet/LeadMagnetModal'
import LeadMagnetTable from '../components/leadmagnet/LeadMagnetTable'

const LeadMagnets = () => {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { canCreateLeadMagnets } = useWorkspaceRole(currentWorkspace?.id)
  
  const [showModal, setShowModal] = useState(false)
  const [selectedMagnet, setSelectedMagnet] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('DESC')

  const PAGE_SIZE = 20

  // Fetch lead magnets
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['lead-magnets', currentWorkspace?.id, currentPage, sortBy, sortDir],
    queryFn: () => leadMagnetService.listLeadMagnets(currentWorkspace?.id, {
      page: currentPage,
      size: PAGE_SIZE,
      sortBy,
      sortDir,
    }),
    enabled: !!currentWorkspace?.id,
  })

  const magnets = response?.content || []
  const totalPages = response?.totalPages || 0

  // Filter magnets
  const filteredMagnets = useMemo(() => {
    return magnets.filter(magnet => {
      const matchesSearch = magnet.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? magnet.active : !magnet.active)
      return matchesSearch && matchesStatus
    })
  }, [magnets, searchQuery, statusFilter])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (magnetId) => leadMagnetService.deleteLeadMagnet(currentWorkspace?.id, magnetId),
    onSuccess: () => {
      toast.success('Campaign deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['lead-magnets'] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete campaign')
    },
  })

  // Copy URL
  const handleCopyUrl = (magnet) => {
    const publicUrl = `${window.location.origin}/m/${magnet.publicToken}/${magnet.slug}`
    navigator.clipboard.writeText(publicUrl)
    toast.success('Public URL copied to clipboard')
  }

  // Open public page
  const handleOpenPublic = (magnet) => {
    const publicUrl = `${window.location.origin}/m/${magnet.publicToken}/${magnet.slug}`
    window.open(publicUrl, '_blank')
  }

  // Handle edit
  const handleEdit = (magnet) => {
    setSelectedMagnet(magnet)
    setShowModal(true)
  }

  // Handle delete
  const handleDelete = (magnet) => {
    if (window.confirm(`Delete campaign "${magnet.name}"?`)) {
      deleteMutation.mutate(magnet.id)
    }
  }

  // Handle create
  const handleCreate = () => {
    setSelectedMagnet(null)
    setShowModal(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Magnets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your lead magnet campaigns
          </p>
        </div>
        {canCreateLeadMagnets && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus size={18} />
            New Campaign
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white"
          />
        </div>
        <button
          onClick={() => setStatusFilter(statusFilter === 'active' ? null : 'active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            statusFilter === 'active'
              ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700'
              : 'border-gray-200 dark:border-[#30363D] hover:bg-gray-50 dark:hover:bg-[#161B22]'
          }`}
        >
          <Filter size={16} />
          <span className="text-sm">
            {statusFilter === 'active' ? 'Active' : 'All'}
          </span>
        </button>
      </div>

      {/* Table or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-violet-600" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">Failed to load campaigns</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['lead-magnets'] })}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : filteredMagnets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#21262D] rounded-lg flex items-center justify-center mb-4">
            <Plus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No campaigns yet</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create your first lead magnet campaign</p>
          {canCreateLeadMagnets && (
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Create Campaign
            </button>
          )}
        </div>
      ) : (
        <LeadMagnetTable
          magnets={filteredMagnets}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCopyUrl={handleCopyUrl}
          onOpenPublic={handleOpenPublic}
          canManage={canCreateLeadMagnets}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(newSortBy, newSortDir) => {
            setSortBy(newSortBy)
            setSortDir(newSortDir)
            setCurrentPage(0)
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-2 border border-gray-200 dark:border-[#30363D] rounded-lg hover:bg-gray-50 dark:hover:bg-[#161B22] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-2 border border-gray-200 dark:border-[#30363D] rounded-lg hover:bg-gray-50 dark:hover:bg-[#161B22] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      <LeadMagnetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedMagnet(null)
        }}
        magnet={selectedMagnet}
      />
    </div>
  )
}

export default LeadMagnets
