import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  Puzzle,
  Edit2,
  Trash2,
  Layers,
  FileCode,
  PlayCircle,
  Copy,
  Check,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { chromeExtensionService } from '../services/chromeExtensionService'
import { useWorkspaceRole } from '../hooks/useWorkspaceRole'
import ExtensionModal from '../components/extension-lab/ExtensionModal'
import TestCaseModal from '../components/extension-lab/TestCaseModal'
import TestCaseList from '../components/extension-lab/TestCaseList'
import TestSuitesTab from '../components/extension-lab/TestSuitesTab'
import TestRunsTab from '../components/extension-lab/TestRunsTab'
import Modal from '../components/common/Modal'

const STATUS_BADGES = {
  ACTIVE: {
    label: 'Active',
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  DRAFT: {
    label: 'Draft',
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  INACTIVE: {
    label: 'Inactive',
    style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  },
  ARCHIVED: {
    label: 'Archived',
    style: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
}

export default function ChromeExtensionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const { isAdminOrOwner } = useWorkspaceRole(currentWorkspace?.id)

  const [activeTab, setActiveTab] = useState('test-cases') // 'overview', 'test-cases', 'test-runs'
  const [editExtensionOpen, setEditExtensionOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [testCaseModalOpen, setTestCaseModalOpen] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState(null)
  const [deletingTestCase, setDeletingTestCase] = useState(null)
  const [copiedManifest, setCopiedManifest] = useState(false)

  // Fetch extension
  const {
    data: extension,
    isLoading: isExtLoading,
    isError: isExtError,
  } = useQuery({
    queryKey: ['chrome-extension', id, currentWorkspace?.id],
    queryFn: () => chromeExtensionService.getExtension(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  // Fetch test cases
  const {
    data: testCases = [],
    isLoading: isTestsLoading,
  } = useQuery({
    queryKey: ['extension-test-cases', id, currentWorkspace?.id],
    queryFn: () => chromeExtensionService.listTestCases(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  // Fetch test suites
  const {
    data: testSuites = [],
    isLoading: isSuitesLoading,
  } = useQuery({
    queryKey: ['extension-test-suites', currentWorkspace?.id, id],
    queryFn: () => chromeExtensionService.listTestSuites(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id,
  })

  // Delete extension mutation
  const deleteExtMutation = useMutation({
    mutationFn: () => chromeExtensionService.deleteExtension(currentWorkspace.id, id),
    onSuccess: () => {
      toast.success('Chrome Extension deleted')
      queryClient.invalidateQueries({ queryKey: ['chrome-extensions'] })
      navigate('/chrome-extensions')
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete extension')
    },
  })

  // Delete test case mutation
  const deleteTestCaseMutation = useMutation({
    mutationFn: (testCaseId) =>
      chromeExtensionService.deleteTestCase(currentWorkspace.id, id, testCaseId),
    onSuccess: () => {
      toast.success('Test case deleted')
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', id] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', id] })
      setDeletingTestCase(null)
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete test case')
    },
  })

  // Toggle test case enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: (tc) =>
      chromeExtensionService.updateTestCase(currentWorkspace.id, id, tc.id, {
        enabled: !tc.enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', id] })
      toast.success('Test case status updated')
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to toggle status')
    },
  })

  const handleCopyManifest = () => {
    if (extension?.manifestJson) {
      navigator.clipboard.writeText(JSON.stringify(extension.manifestJson, null, 2))
      setCopiedManifest(true)
      toast.success('Manifest JSON copied to clipboard')
      setTimeout(() => setCopiedManifest(false), 2000)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isExtLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading extension project...</p>
      </div>
    )
  }

  if (isExtError || !extension) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/chrome-extensions')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} /> Back to Extension Lab
        </button>
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-center">
          <AlertCircle size={28} className="mx-auto text-rose-600 dark:text-rose-400 mb-2" />
          <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
            Chrome Extension Not Found
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
            This extension may have been removed or belongs to another workspace.
          </p>
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_BADGES[extension.status] || STATUS_BADGES.ACTIVE

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/chrome-extensions')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Extension Lab
        </button>
      </div>

      {/* Extension Header Card */}
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
              <Puzzle size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {extension.name}
                </h1>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  v{extension.version || '1.0.0'}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.style}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              {extension.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {extension.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isAdminOrOwner && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setEditExtensionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#0D1117] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#21262D] transition-colors"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#0D1117] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-4 border-t border-gray-100 dark:border-[#21262D] text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Created: {formatDate(extension.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>Updated: {formatDate(extension.updatedAt)}</span>
          </div>
          {extension.createdByName && (
            <div className="flex items-center gap-1.5">
              <User size={14} />
              <span>Registered by: {extension.createdByName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <ShieldCheck size={14} />
            <span>Manifest V3 Protected</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#30363D]">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('test-cases')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'test-cases'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Layers size={16} />
            <span>Test Cases</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
              {testCases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test-suites')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'test-suites'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Layers size={16} />
            <span>Test Suites</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
              {testSuites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FileCode size={16} />
            <span>Overview & Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test-runs')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'test-runs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <PlayCircle size={16} />
            <span>Test Runs & Execution</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'test-cases' && (
        <TestCaseList
          testCases={testCases}
          canManage={isAdminOrOwner}
          onCreate={() => {
            setEditingTestCase(null)
            setTestCaseModalOpen(true)
          }}
          onEdit={(tc) => {
            setEditingTestCase(tc)
            setTestCaseModalOpen(true)
          }}
          onDelete={(tc) => setDeletingTestCase(tc)}
          onToggleEnabled={(tc) => toggleEnabledMutation.mutate(tc)}
        />
      )}

      {activeTab === 'test-suites' && (
        <TestSuitesTab
          workspaceId={currentWorkspace?.id}
          extensionId={id}
          testCases={testCases}
          canManage={isAdminOrOwner}
        />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manifest JSON Inspector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Manifest V3 Definition
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Registered extension configuration, permissions, and background worker settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyManifest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-[#30363D] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#21262D]"
                >
                  {copiedManifest ? <Check size={14} /> : <Copy size={14} />}
                  {copiedManifest ? 'Copied' : 'Copy JSON'}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto max-h-96">
                {JSON.stringify(extension.manifestJson || {}, null, 2)}
              </pre>
            </div>
          </div>

          {/* Quick Stats & Architecture Info */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Integration Architecture
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-indigo-50/75 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Workspace Scoped
                  </span>
                  <p className="text-indigo-700 dark:text-indigo-400">
                    All CRUD operations executed by this extension are strictly validated against Workspace #{extension.workspaceId}.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                    Stateless Auth Contract
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    The extension uses scoped Bearer tokens to communicate with Spring Boot endpoints.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test-runs' && (
        <TestRunsTab
          workspaceId={currentWorkspace?.id}
          extensionId={id}
          testCases={testCases}
        />
      )}

      {/* Edit Extension Modal */}
      <ExtensionModal
        isOpen={editExtensionOpen}
        onClose={() => setEditExtensionOpen(false)}
        extension={extension}
      />

      {/* Delete Extension Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Chrome Extension"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{extension.name}"
            </span>
            ? This action will archive the extension project.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteExtMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteExtMutation.mutate()}
              disabled={deleteExtMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleteExtMutation.isPending && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Test Case Create/Edit Modal */}
      <TestCaseModal
        isOpen={testCaseModalOpen}
        onClose={() => setTestCaseModalOpen(false)}
        extensionId={id}
        testCase={editingTestCase}
      />

      {/* Test Case Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTestCase}
        onClose={() => setDeletingTestCase(null)}
        title="Delete Test Case"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete test case{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{deletingTestCase?.name}"
            </span>
            ?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
            <button
              type="button"
              onClick={() => setDeletingTestCase(null)}
              disabled={deleteTestCaseMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteTestCaseMutation.mutate(deletingTestCase.id)}
              disabled={deleteTestCaseMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleteTestCaseMutation.isPending && (
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
