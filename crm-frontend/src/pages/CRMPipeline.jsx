import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { FiBriefcase, FiChevronDown, FiRefreshCw } from 'react-icons/fi'
import {
  createLead,
  deleteLead,
  filterLeads,
  getLeadAnalytics,
  updateLead,
  updateLeadStatus,
} from '../services/crmService'
import { workspaceService } from '../services/workspaceService'
import {
  clearFilters,
  optimisticUpdateLeadStatus,
  setFilters,
  setLeads,
  setSelectedLead,
  setViewMode,
} from '../store/slices/crmSlice'
import {
  setActiveLeadId,
  setPipelineSort,
  setSelectedWorkspaceId,
} from '../store/slices/pipelineSlice'
import PipelineHeader from '../components/crm/PipelineHeader'
import PipelineColumn from '../components/crm/PipelineColumn'
import PipelineAnalytics from '../components/crm/PipelineAnalytics'
import LeadModal from '../components/crm/LeadModal'
import LeadDetailsDrawer from '../components/crm/LeadDetailsDrawer'
import LeadCard from '../components/crm/LeadCard'
import Spinner from '../components/common/Spinner'
import { useAutoRefreshOnMemberRemoval } from '../hooks/useAutoRefreshOnMemberRemoval'

const PIPELINE_STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']

const SORT_OPTIONS = [
  { label: 'Newest first', sortBy: 'createdAt', sortDir: 'DESC' },
  { label: 'Oldest first', sortBy: 'createdAt', sortDir: 'ASC' },
  { label: 'Highest value', sortBy: 'dealValue', sortDir: 'DESC' },
  { label: 'Closing soon', sortBy: 'expectedCloseDate', sortDir: 'ASC' },
]

const getPageContent = (payload) => payload?.content ?? payload ?? []

const CRMPipeline = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { filters, selectedLead, viewMode } = useSelector((state) => state.crm)
  const { activeLeadId, selectedWorkspaceId, sortBy, sortDir } = useSelector((state) => state.pipeline)
  const [modalState, setModalState] = useState({ isOpen: false, lead: null, initialStatus: 'LEAD' })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(currentWorkspace?.id, queryClient)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { data: workspaces = [], isLoading: workspacesLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getAll,
  })

  const workspaceList = useMemo(() => getPageContent(workspaces), [workspaces])
  const activeWorkspaceId = selectedWorkspaceId || currentWorkspace?.id || workspaceList[0]?.id || null

  useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== selectedWorkspaceId) {
      dispatch(setSelectedWorkspaceId(activeWorkspaceId))
    }
  }, [activeWorkspaceId, dispatch, selectedWorkspaceId])

  const leadQueryParams = useMemo(() => ({
    ...filters,
    page: 0,
    size: 200,
    sortBy,
    sortDir,
  }), [filters, sortBy, sortDir])

  const {
    data: leadsPage,
    isLoading: leadsLoading,
    isFetching: leadsFetching,
  } = useQuery({
    queryKey: ['crm-leads', activeWorkspaceId, leadQueryParams],
    queryFn: () => filterLeads(activeWorkspaceId, leadQueryParams),
    enabled: Boolean(activeWorkspaceId),
  })

  const leads = useMemo(() => getPageContent(leadsPage), [leadsPage])

  useEffect(() => {
    dispatch(setLeads(leads))
  }, [dispatch, leads])

  const { data: membersPage, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () => workspaceService.getMembers(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  })

  const workspaceMembers = useMemo(() => getPageContent(membersPage), [membersPage])

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['crm-analytics', activeWorkspaceId],
    queryFn: () => getLeadAnalytics(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  })

  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeLeadId),
    [activeLeadId, leads]
  )

  const leadsByStage = useMemo(() => PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter((lead) => lead.status === stage)
    return acc
  }, {}), [leads])

  const invalidatePipeline = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-leads'] })
    queryClient.invalidateQueries({ queryKey: ['crm-analytics'] })
  }

  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success('Lead created')
      invalidatePipeline()
    },
    onError: (error) => toast.error(error.message || 'Failed to create lead'),
  })

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, data }) => updateLead(leadId, data),
    onSuccess: () => {
      toast.success('Lead updated')
      invalidatePipeline()
    },
    onError: (error) => toast.error(error.message || 'Failed to update lead'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }) => updateLeadStatus(leadId, { status }),
    onMutate: async ({ leadId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['crm-leads'] })
      const queryKey = ['crm-leads', activeWorkspaceId, leadQueryParams]
      const previous = queryClient.getQueryData(queryKey)
      dispatch(optimisticUpdateLeadStatus({ leadId, newStatus: status }))
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.content) return old
        return {
          ...old,
          content: old.content.map((lead) => (
            lead.id === leadId ? { ...lead, status } : lead
          )),
        }
      })
      return { previous, queryKey }
    },
    onSuccess: () => {
      invalidatePipeline()
    },
    onError: (error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
      toast.error(error.message || 'Failed to move lead')
      invalidatePipeline()
    },
  })

  const deleteLeadMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      toast.success('Lead deleted')
      setIsDrawerOpen(false)
      dispatch(setSelectedLead(null))
      invalidatePipeline()
    },
    onError: (error) => toast.error(error.message || 'Failed to delete lead'),
  })

  const handleCreateLead = (status = 'LEAD') => {
    setModalState({ isOpen: true, lead: null, initialStatus: status })
  }

  const handleEditLead = (lead) => {
    setModalState({ isOpen: true, lead, initialStatus: lead.status })
  }

  const handleViewLead = (lead) => {
    dispatch(setSelectedLead(lead))
    setIsDrawerOpen(true)
  }

  const handleDeleteLead = (leadId) => {
    if (window.confirm('Delete this lead permanently?')) {
      deleteLeadMutation.mutate(leadId)
    }
  }

  const handleLeadSubmit = async (data) => {
    if (modalState.lead) {
      await updateLeadMutation.mutateAsync({ leadId: modalState.lead.id, data })
      return
    }
    await createLeadMutation.mutateAsync({ ...data, workspaceId: activeWorkspaceId })
  }

  const resolveStageFromOver = (overId) => {
    if (PIPELINE_STAGES.includes(overId)) return overId
    return leads.find((lead) => lead.id === overId)?.status
  }

  const handleDragStart = ({ active }) => {
    dispatch(setActiveLeadId(active.id))
  }

  const handleDragEnd = ({ active, over }) => {
    dispatch(setActiveLeadId(null))
    if (!over) return

    const lead = leads.find((item) => item.id === active.id)
    const nextStatus = resolveStageFromOver(over.id)
    if (!lead || !nextStatus || lead.status === nextStatus) return

    updateStatusMutation.mutate({ leadId: lead.id, status: nextStatus })
  }

  const handleDragCancel = () => {
    dispatch(setActiveLeadId(null))
  }

  if (workspacesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-gray-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white">
            <FiBriefcase size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a workspace first</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            CRM leads belong to a workspace, so your pipeline will appear as soon as a workspace exists.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm dark:border-orange-900/50 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950/30">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              Enterprise CRM
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">
              Pipeline Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
              Track revenue, move deals through the funnel, and keep customer activity close to the work.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <select
                value={activeWorkspaceId}
                onChange={(event) => dispatch(setSelectedWorkspaceId(Number(event.target.value)))}
                className="appearance-none rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 pr-10 text-sm font-semibold text-gray-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
              >
                {workspaceList.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </label>

            <label className="relative">
              <select
                value={`${sortBy}:${sortDir}`}
                onChange={(event) => {
                  const [nextSortBy, nextSortDir] = event.target.value.split(':')
                  dispatch(setPipelineSort({ sortBy: nextSortBy, sortDir: nextSortDir }))
                }}
                className="appearance-none rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 pr-10 text-sm font-semibold text-gray-800 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={`${option.sortBy}:${option.sortDir}`} value={`${option.sortBy}:${option.sortDir}`}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </label>
          </div>
        </div>
      </div>

      <PipelineHeader
        onCreateLead={handleCreateLead}
        onSearch={(search) => dispatch(setFilters({ search }))}
        onFilterChange={(nextFilters) => dispatch(setFilters(nextFilters))}
        filters={filters}
        workspaceMembers={workspaceMembers}
        analytics={analytics}
        viewMode={viewMode}
        onViewModeChange={(mode) => dispatch(setViewMode(mode))}
      />

      {leadsFetching && !leadsLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FiRefreshCw className="animate-spin" />
          Syncing pipeline...
        </div>
      )}

      {analyticsLoading ? (
        <div className="card flex items-center justify-center p-10">
          <Spinner size="lg" />
        </div>
      ) : analytics && (
        <PipelineAnalytics analytics={analytics} />
      )}

      {leadsLoading || membersLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : viewMode === 'pipeline' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex min-h-[620px] gap-4">
              {PIPELINE_STAGES.map((stage) => (
                <PipelineColumn
                  key={stage}
                  status={stage}
                  leads={leadsByStage[stage]}
                  totalValue={leadsByStage[stage].reduce((sum, lead) => sum + Number(lead.dealValue || 0), 0)}
                  onAddLead={handleCreateLead}
                  onEditLead={handleEditLead}
                  onDeleteLead={handleDeleteLead}
                  onViewLead={handleViewLead}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="w-80 rotate-2 opacity-95 shadow-2xl">
                <LeadCard
                  lead={activeLead}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onView={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <motion.div layout className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Lead</th>
                  <th className="px-5 py-4">Company</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4 text-right">Value</th>
                  <th className="px-5 py-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleViewLead(lead)}
                    className="cursor-pointer transition hover:bg-orange-50/60 dark:hover:bg-orange-950/20"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{lead.company || '-'}</td>
                    <td className="px-5 py-4 text-sm font-semibold">{lead.status}</td>
                    <td className="px-5 py-4 text-sm">{lead.priority}</td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(lead.dealValue || 0))}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {lead.assignedTo?.fullName || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!leadsLoading && leads.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center dark:border-gray-700 dark:bg-gray-800/60">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No leads match this view</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a lead or clear filters to refill the board.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button className="btn-secondary" onClick={() => dispatch(clearFilters())}>
              Clear filters
            </button>
            <button className="btn-primary" onClick={() => handleCreateLead('LEAD')}>
              Create lead
            </button>
          </div>
        </div>
      )}

      <LeadModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, lead: null, initialStatus: 'LEAD' })}
        onSubmit={handleLeadSubmit}
        lead={modalState.lead}
        workspaceId={activeWorkspaceId}
        workspaceMembers={workspaceMembers}
        initialStatus={modalState.initialStatus}
      />

      <LeadDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        lead={selectedLead}
        onEdit={handleEditLead}
        onDelete={handleDeleteLead}
      />
    </div>
  )
}

export default CRMPipeline
