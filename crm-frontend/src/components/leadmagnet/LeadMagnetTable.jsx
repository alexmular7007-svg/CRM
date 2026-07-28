import { useState } from 'react'
import { MoreVertical, ArrowUpDown, Copy, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const LeadMagnetTable = ({
  magnets,
  onEdit,
  onDelete,
  onCopyUrl,
  onOpenPublic,
  canManage,
  sortBy,
  sortDir,
  onSort,
}) => {
  const [expandedId, setExpandedId] = useState(null)

  const handleSort = (column) => {
    if (sortBy === column) {
      onSort(column, sortDir === 'ASC' ? 'DESC' : 'ASC')
    } else {
      onSort(column, 'DESC')
    }
  }

  const columns = [
    { key: 'name', label: 'Campaign Name', sortable: true },
    { key: 'active', label: 'Status', sortable: false },
    { key: 'views', label: 'Views', sortable: false },
    { key: 'uniqueViews', label: 'Unique Views', sortable: false },
    { key: 'submissions', label: 'Submissions', sortable: false },
    { key: 'conversionRate', label: 'Conversion %', sortable: false },
    { key: 'createdBy', label: 'Created By', sortable: false },
    { key: 'createdAt', label: 'Created Date', sortable: true },
    { key: 'updatedAt', label: 'Updated Date', sortable: true },
    { key: 'publicUrl', label: 'Public URL', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
  ]

  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
  }

  const calculateConversion = (magnet) => {
    if (magnet.views === 0) return '0'
    return ((magnet.submissions / magnet.views) * 100).toFixed(2)
  }

  const getPublicUrl = (magnet) => {
    return `${window.location.origin}/m/${magnet.publicToken}/${magnet.slug}`
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#30363D]">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 ${
                  col.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0D1117]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && (
                    <ArrowUpDown
                      size={14}
                      className={sortBy === col.key ? 'text-violet-600' : 'text-gray-400'}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {magnets.map((magnet) => (
            <tr
              key={magnet.id}
              className="border-b border-gray-100 dark:border-[#21262D] hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {magnet.name}
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    magnet.active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-[#21262D] text-gray-800 dark:text-gray-400'
                  }`}
                >
                  {magnet.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {magnet.views || 0}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {magnet.uniqueViews || 0}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {magnet.submissions || 0}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {calculateConversion(magnet)}%
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {magnet.createdByName || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(magnet.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(magnet.updatedAt)}
              </td>
              <td className="px-4 py-3 text-sm">
                <button
                  onClick={() => onCopyUrl(magnet)}
                  className="text-violet-600 hover:text-violet-700 text-xs font-medium"
                  title="Copy URL"
                >
                  Copy
                </button>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="relative">
                  <button
                    onClick={() => setExpandedId(expandedId === magnet.id ? null : magnet.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#30363D] rounded"
                  >
                    <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {expandedId === magnet.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          onOpenPublic(magnet)
                          setExpandedId(null)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] flex items-center gap-2 first:rounded-t-lg"
                      >
                        <ExternalLink size={14} />
                        Open Public Page
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              onEdit(magnet)
                              setExpandedId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] flex items-center gap-2"
                          >
                            <Edit2 size={14} />
                            Edit Campaign
                          </button>
                          <button
                            onClick={() => {
                              onDelete(magnet)
                              setExpandedId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 last:rounded-b-lg"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LeadMagnetTable
