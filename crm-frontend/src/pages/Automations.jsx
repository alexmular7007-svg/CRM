import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Plus, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { automationService } from '../services/automationService'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import AutomationTable from '../components/automation/AutomationTable'

const PAGE_SIZE = 20

export default function Automations() {
  const navigate = useNavigate()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { isAdminOrOwner } = useWorkspaceRole(currentWorkspace?.id)
  const queryClient = useQueryClient()

  // Log currentWorkspace changes
  useEffect(() => {
    // currentWorkspace updated, queries will re-run automatically via queryKey dependency
  }, [currentWorkspace])

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  // Fetch automations
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['automations', currentWorkspace?.id, page, status],
    queryFn: () => {
      if (!currentWorkspace?.id) {
        return Promise.resolve(null)
      }
      return automationService
        .listAutomations(currentWorkspace.id, {
          page,
          size: PAGE_SIZE,
          status: status || undefined,
        })
        .catch((err) => {
          throw err
        })
    },
    enabled: !!currentWorkspace?.id,
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => automationService.deleteAutomation(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Automation deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
    onError: (error) => toast.error(error?.message || 'Unable to delete automation'),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => automationService.activateAutomation(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Automation activated')
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
    onError: (error) => toast.error(error?.message || 'Unable to activate automation'),
  })

  const pauseMutation = useMutation({
    mutationFn: (id) => automationService.pauseAutomation(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Automation paused')
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
    onError: (error) => toast.error(error?.message || 'Unable to pause automation'),
  })

  // Filter automations by search
  const automations = useMemo(() => {
    const items = response?.content || []
    return items.filter((automation) => automation.name.toLowerCase().includes(search.toLowerCase()))
  }, [response, search])

  const statusOptions = ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create and manage automated workflows for your leads.
          </p>
        </div>
        {isAdminOrOwner && (
          <button
            type="button"
            onClick={() => navigate('/marketing/automations/new')}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 transition-colors"
          >
            <Plus size={18} />
            New Automation
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            aria-label="Search automations"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder="Search automations..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            aria-label="Filter by automation status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(0)
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-3 rounded-lg border border-gray-200 p-5 dark:border-[#30363D]">
          <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-[#21262D]" />
          <div className="h-12 rounded bg-gray-100 dark:bg-[#161B22]" />
          <div className="h-12 rounded bg-gray-100 dark:bg-[#161B22]" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          Failed to load automations.{' '}
          <button type="button" onClick={() => refetch()} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : automations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-[#30363D]">
          <p className="font-medium text-gray-900 dark:text-white">No automations yet</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isAdminOrOwner
              ? 'Create your first automation to get started.'
              : 'Automations created by your team will appear here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white dark:border-[#30363D] dark:bg-[#161B22]">
            <AutomationTable
              automations={automations}
              canManage={isAdminOrOwner}
              onView={(automation) => {
                navigate(`/marketing/automations/${automation.id}`)
              }}
              onEdit={(automation) => {
                navigate(`/marketing/automations/${automation.id}/edit`)
              }}
              onDelete={(automation) => {
                if (window.confirm(`Delete automation "${automation.name}"?`)) {
                  deleteMutation.mutate(automation.id)
                }
              }}
              onActivate={(automation) => {
                activateMutation.mutate(automation.id)
              }}
              onPause={(automation) => {
                pauseMutation.mutate(automation.id)
              }}
            />
          </div>

          {/* Pagination */}
          {response?.totalPages > 1 && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page + 1} of {response?.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= response?.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
