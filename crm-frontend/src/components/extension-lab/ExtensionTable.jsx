import { Eye, Edit2, Trash2, Puzzle, CheckCircle, Clock } from 'lucide-react'

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

export default function ExtensionTable({
  extensions = [],
  canManage = false,
  onView,
  onEdit,
  onDelete,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="w-full">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 dark:border-[#30363D] bg-gray-50/75 dark:bg-[#0D1117]/50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-5 py-3.5">Extension Project</th>
              <th className="px-5 py-3.5">Version</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Test Cases</th>
              <th className="px-5 py-3.5">Created</th>
              <th className="px-5 py-3.5">Updated</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#30363D]">
            {extensions.map((ext) => {
              const statusCfg = STATUS_BADGES[ext.status] || STATUS_BADGES.ACTIVE
              return (
                <tr
                  key={ext.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-[#21262D]/60 transition-colors"
                >
                  {/* Extension Name & Description */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <Puzzle size={18} />
                      </div>
                      <div className="max-w-xs truncate">
                        <button
                          type="button"
                          onClick={() => onView(ext.id)}
                          className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block"
                        >
                          {ext.name}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {ext.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      v{ext.version || '1.0.0'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.style}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Test Cases */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <CheckCircle size={14} className="text-indigo-500" />
                      <span className="font-medium">{ext.testCaseCount || 0}</span> tests
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(ext.createdAt)}
                  </td>

                  {/* Updated */}
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(ext.updatedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(ext.id)}
                        title="View Details"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-[#21262D] transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(ext)}
                            title="Edit Extension"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-[#21262D] transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(ext)}
                            title="Delete Extension"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:text-gray-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< 768px) */}
      <div className="md:hidden space-y-3">
        {extensions.map((ext) => {
          const statusCfg = STATUS_BADGES[ext.status] || STATUS_BADGES.ACTIVE
          return (
            <div
              key={ext.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <Puzzle size={16} />
                  </div>
                  <div>
                    <h3
                      onClick={() => onView(ext.id)}
                      className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {ext.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      v{ext.version || '1.0.0'}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.style}`}
                >
                  {statusCfg.label}
                </span>
              </div>

              {ext.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {ext.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-[#21262D]">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDate(ext.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                  <CheckCircle size={12} className="text-indigo-500" />
                  <span>{ext.testCaseCount || 0} tests</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onView(ext.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                >
                  <Eye size={14} /> View Details
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(ext)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(ext)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
