import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { leadMagnetService } from '../services/leadMagnetService'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import { ArrowLeft, Copy, ExternalLink, Edit2, Trash2, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import LeadMagnetModal from '../components/leadmagnet/LeadMagnetModal'
import AnalyticsCards from '../components/leadmagnet/AnalyticsCards'
import SubmissionsTable from '../components/leadmagnet/SubmissionsTable'

const LeadMagnetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { canCreateLeadMagnets } = useWorkspaceRole(currentWorkspace?.id)

  const [showEditModal, setShowEditModal] = useState(false)

  // Fetch magnet details
  const { data: magnet, isLoading, error } = useQuery({
    queryKey: ['lead-magnet', id, currentWorkspace?.id],
    queryFn: () => leadMagnetService.getLeadMagnet(currentWorkspace?.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      leadMagnetService.deleteLeadMagnet(currentWorkspace?.id, id),
    onSuccess: () => {
      toast.success('Campaign deleted successfully')
      navigate('/marketing/lead-magnets')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete campaign')
    },
  })

  const handleCopyUrl = () => {
    if (magnet) {
      const url = `${window.location.origin}/m/${magnet.publicToken}/${magnet.slug}`
      navigator.clipboard.writeText(url)
      toast.success('Public URL copied to clipboard')
    }
  }

  const handleOpenPublic = () => {
    if (magnet) {
      const url = `${window.location.origin}/m/${magnet.publicToken}/${magnet.slug}`
      window.open(url, '_blank')
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-violet-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error || !magnet) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/marketing/lead-magnets')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Campaign not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/marketing/lead-magnets')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Campaigns
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{magnet.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {magnet.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            title="Copy Public URL"
          >
            <Copy size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleOpenPublic}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            title="Open Public Page"
          >
            <ExternalLink size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          {canCreateLeadMagnets && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      {magnet && <AnalyticsCards magnet={magnet} />}

      {/* Campaign Info & Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Campaign Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className={`text-sm font-medium ${magnet.active ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {magnet.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Slug</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{magnet.slug}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Public Token</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 dark:bg-[#161B22] px-2 py-1 rounded font-mono">
                    {magnet.publicToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(magnet.publicToken)
                      toast.success('Token copied')
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded"
                  >
                    <Copy size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created By</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{magnet.createdByName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(magnet.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="lg:col-span-2">
          <SubmissionsTable magnet={magnet} />
        </div>
      </div>

      {/* Edit Modal */}
      <LeadMagnetModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        magnet={magnet}
      />
    </div>
  )
}

export default LeadMagnetDetails
