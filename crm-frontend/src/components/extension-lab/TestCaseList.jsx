import { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_BADGES = {
  API_CRUD: {
    label: 'API CRUD',
    icon: Terminal,
    style: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  STORAGE_CRUD: {
    label: 'Storage CRUD',
    icon: Database,
    style: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  DOM_INJECTION: {
    label: 'DOM Injection',
    icon: Layers,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  INTEGRATION: {
    label: 'Integration',
    icon: Sparkles,
    style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  BROWSER: {
    label: 'Browser (Playwright)',
    icon: Code,
    style: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
}

export default function TestCaseList({
  testCases = [],
  canManage = false,
  onCreate,
  onEdit,
  onDelete,
  onToggleEnabled,
}) {
  const [expandedId, setExpandedId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleCopy = (id, obj) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    setCopiedId(id)
    toast.success('Configuration copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-[#30363D]">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Test Case Suite
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {testCases.length} total
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure CRUD assertions, storage keys, and DOM selectors for this extension.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus size={14} /> Add Test Case
          </button>
        )}
      </div>

      {/* Empty State */}
      {testCases.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 dark:border-[#30363D] bg-white dark:bg-[#161B22]/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
            <Code size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No test cases defined yet</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Add API CRUD operations, storage tests, or DOM injection checks to verify this extension.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={onCreate}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus size={14} /> Create First Test Case
            </button>
          )}
        </div>
      ) : (
        /* Test Case Items */
        <div className="space-y-2.5">
          {testCases.map((tc) => {
            const typeCfg = TYPE_BADGES[tc.testType] || TYPE_BADGES.API_CRUD
            const TypeIcon = typeCfg.icon
            const isExpanded = expandedId === tc.id

            return (
              <div
                key={tc.id}
                className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm overflow-hidden transition-all"
              >
                {/* Main Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(tc.id)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${typeCfg.style}`}
                        >
                          <TypeIcon size={12} />
                          {typeCfg.label}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tc.name}
                        </h4>
                        {!tc.enabled && (
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                            Disabled
                          </span>
                        )}
                      </div>
                      {tc.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#21262D]">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onToggleEnabled(tc)}
                        title={tc.enabled ? 'Click to disable' : 'Click to enable'}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {tc.enabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(tc.id)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                      >
                        {isExpanded ? 'Hide Payload' : 'Inspect'}
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(tc)}
                            title="Edit Test Case"
                            className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tc)}
                            title="Delete Test Case"
                            className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50/75 dark:bg-[#0D1117]/60 border-t border-gray-200 dark:border-[#30363D] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Configuration */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Configuration Payload:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tc.id, tc.configuration)}
                          className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center gap-1 text-[11px]"
                        >
                          {copiedId === tc.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === tc.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-48">
                        {JSON.stringify(tc.configuration || {}, null, 2)}
                      </pre>
                    </div>

                    {/* Expected Result */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Expected Result & Assertions:
                        </span>
                      </div>
                      <pre className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-48">
                        {JSON.stringify(tc.expectedResult || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
