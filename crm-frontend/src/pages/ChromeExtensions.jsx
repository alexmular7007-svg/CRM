import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  Puzzle,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chromeExtensionService } from '../services/chromeExtensionService'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import ExtensionTable from '../components/extension-lab/ExtensionTable'
import ExtensionModal from '../components/extension-lab/ExtensionModal'
import Modal from '../components/common/Modal'

const PAGE_SIZE = 15

export default function ChromeExtensions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { isAdminOrOwner } = useWorkspaceRole(currentWorkspace?.id)

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExtension, setEditingExtension] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Fetch extensions
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['chrome-extensions', currentWorkspace?.id, page, search],
    queryFn: () => {
      if (!currentWorkspace?.id) return Promise.resolve(null)
      return chromeExtensionService.listExtensions(currentWorkspace.id, {
        page,
        size: PAGE_SIZE,
        search: search.trim() || undefined,
      })
    },
    enabled: !!currentWorkspace?.id,
  })

  // Delete mutation (soft delete/archive)
  const deleteMutation = useMutation({
    mutationFn: (extensionId) =>
      chromeExtensionService.deleteExtension(currentWorkspace.id, extensionId),
    onSuccess: () => {
      toast.success('Chrome Extension deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['chrome-extensions'] })
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete extension')
    },
  })

  const rawExtensions = response?.content || []
  const totalPages = response?.totalPages || 1
  const totalElements = response?.totalElements || rawExtensions.length

  // Client-side filter for status if selected
  const filteredExtensions = useMemo(() => {
    if (!statusFilter) return rawExtensions
    return rawExtensions.filter((ext) => ext.status === statusFilter)
  }, [rawExtensions, statusFilter])

  // Summary statistics
  const stats = useMemo(() => {
    const total = totalElements
    const active = rawExtensions.filter((ext) => ext.status === 'ACTIVE').length
    const totalTests = rawExtensions.reduce((acc, ext) => acc + (ext.testCaseCount || 0), 0)
    return { total, active, totalTests }
  }, [rawExtensions, totalElements])

  const handleOpenCreate = () => {
    setEditingExtension(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (ext) => {
    setEditingExtension(ext)
    setModalOpen(true)
  }

  const handleView = (extensionId) => {
    navigate(`/chrome-extensions/${extensionId}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Puzzle size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Extension Lab
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Google Chrome Extension CRUD operations & testing framework dashboard.
              </p>
            </div>
          </div>
        </div>

        {isAdminOrOwner && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all shadow-indigo-600/20 self-start sm:self-auto"
          >
            <Plus size={18} />
            <span>Register Extension</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Puzzle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Extensions
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Projects
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.active}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Configured Test Cases
            </p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalTests}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-[#30363D] shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search extensions by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-[#30363D] rounded-lg bg-gray-50/50 dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Content: Table / Skeletons / Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#161B22] rounded-2xl border border-gray-200 dark:border-[#30363D]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading extensions...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl">
          <p className="text-sm text-rose-800 dark:text-rose-300">
            Failed to load extensions for this workspace.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : filteredExtensions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#161B22]/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
            <Sparkles size={28} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {search ? 'No matching extensions found' : 'No Chrome Extensions registered yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {search
              ? `No extension matches your search term "${search}". Clear the search to view all.`
              : 'Register your Chrome Extension project to configure and test CRUD operations against CRM endpoints.'}
          </p>
          {!search && isAdminOrOwner && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} /> Register First Extension
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <ExtensionTable
            extensions={filteredExtensions}
            canManage={isAdminOrOwner}
            onView={handleView}
            onEdit={handleOpenEdit}
            onDelete={(ext) => setDeleteTarget(ext)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {page + 1} of {totalPages} ({totalElements} extensions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Extension Modal */}
      <ExtensionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        extension={editingExtension}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Chrome Extension"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{deleteTarget?.name}"
            </span>
            ? This will archive the extension and all its associated test cases.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleteMutation.isPending && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
