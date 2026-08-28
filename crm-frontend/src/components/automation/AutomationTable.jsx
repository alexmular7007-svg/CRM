import { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Edit2, Trash2, Play, Pause, MoreVertical } from 'lucide-react'
import { useWorkspaceRole } from '../../hooks/useWorkspaceRole'

const statusBadgeStyles = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PAUSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ARCHIVED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const triggerTypeLabels = {
  LEAD_CREATED: 'Lead Created',
  LEAD_MAGNET_SUBMITTED: 'Lead Magnet Submitted',
  EMAIL_DELIVERED: 'Email Delivered',
  EMAIL_OPENED: 'Email Opened',
  EMAIL_CLICKED: 'Email Clicked',
  EMAIL_BOUNCED: 'Email Bounced',
}

export default function AutomationTable({
  automations = [],
  canManage = false,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onPause,
}) {
  const [openMenuId, setOpenMenuId] = useState(null)

  const dateFormat = (value) => (value ? format(new Date(value), 'MMM dd, yyyy') : '-')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#30363D]">
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Automation
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Trigger
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Steps
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Executions
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Last Run
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
              Updated
            </th>
            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {automations.map((automation) => (
            <tr
              key={automation.id}
              className="border-b border-gray-200 hover:bg-gray-50 dark:border-[#30363D] dark:hover:bg-[#161B22]"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 dark:text-white">
                  {automation.name}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {triggerTypeLabels[automation.triggerType] || automation.triggerType}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusBadgeStyles[automation.status] || statusBadgeStyles.DRAFT
                  }`}
                >
                  {automation.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {automation.stepCount || 0} steps
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {automation.executionCount || 0}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {dateFormat(automation.lastExecutedAt)}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {dateFormat(automation.updatedAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="relative inline-block">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === automation.id ? null : automation.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>

                  {openMenuId === automation.id && (
                    <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[#30363D] dark:bg-[#161B22] z-10">
                      <button
                        onClick={() => {
                          onView?.(automation)
                          setOpenMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#21262D]"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              onEdit?.(automation)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#21262D]"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>

                          {automation.status !== 'ACTIVE' && (
                            <button
                              onClick={() => {
                                onActivate?.(automation)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#21262D]"
                            >
                              <Play size={14} />
                              Activate
                            </button>
                          )}

                          {automation.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                onPause?.(automation)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#21262D]"
                            >
                              <Pause size={14} />
                              Pause
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onDelete?.(automation)
                              setOpenMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-[#21262D]"
                          >
                            <Trash2 size={14} />
                            Archive
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
