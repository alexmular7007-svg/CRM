import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { 
  FiX, FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, 
  FiCalendar, FiTag, FiEdit2, FiTrash2, FiClock, FiActivity, FiArrowRight
} from 'react-icons/fi'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getLeadActivities } from '../../services/crmService'
import LeadAIAssistant from '../ai/LeadAIAssistant'
import LeadConversionDrawer from './LeadConversionDrawer'

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const statusColors = {
  LEAD: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  QUALIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROPOSAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  NEGOTIATION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  WON: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const LeadDetailsDrawer = ({ isOpen, onClose, lead, onEdit, onDelete, workspaceId, onLeadConverted }) => {
  const [showConversionDrawer, setShowConversionDrawer] = useState(false)
  const { data: activitiesData } = useQuery({
    queryKey: ['leadActivities', lead?.id],
    queryFn: () => getLeadActivities(lead.id),
    enabled: !!lead?.id && isOpen,
  })

  const activities = activitiesData?.data ?? activitiesData ?? []

  const formatCurrency = (value) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!lead) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {lead.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[lead.priority]}`}>
                      {lead.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onEdit(lead)
                    onClose()
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiEdit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(lead.id)
                    onClose()
                  }}
                  className="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
                
                {/* Convert to Project Button (only for WON leads) */}
                {lead.status === 'WON' && !lead.converted && (
                  <button
                    onClick={() => setShowConversionDrawer(true)}
                    className="btn-secondary bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-2 ml-auto"
                  >
                    <FiBriefcase size={16} />
                    Convert
                    <FiArrowRight size={14} />
                  </button>
                )}
                
                {/* Already Converted Badge */}
                {lead.converted && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      Converted to Project
                    </div>
                    {lead.convertedProjectId && (
                      <button
                        onClick={() => {
                          window.location.href = `/projects/${lead.convertedProjectId}/kanban`
                        }}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-2 text-sm transition-colors"
                      >
                        Open Project
                        <FiArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <LeadAIAssistant lead={lead} activities={activities} />

              {/* Deal Value */}
              {lead.dealValue > 0 && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Deal Value</span>
                    <div className="flex items-center text-2xl font-bold text-green-700 dark:text-green-400">
                      <FiDollarSign className="mr-1" />
                      {formatCurrency(lead.dealValue)}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiUser />
                  Contact Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <FiMail className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.email}</p>
                    </div>
                  </div>

                  {lead.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <FiPhone className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.phone}</p>
                      </div>
                    </div>
                  )}

                  {lead.company && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <FiBriefcase className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.company}</p>
                      </div>
                    </div>
                  )}

                  {lead.position && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Position</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.position}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expected Close Date */}
              {lead.expectedCloseDate && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiCalendar />
                    Expected Close Date
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(lead.expectedCloseDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned To */}
              {lead.assignedTo && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assigned To
                  </h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                      {lead.assignedTo.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {lead.assignedTo.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {lead.assignedTo.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiTag />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notes
                  </h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiActivity />
                  Activity Timeline
                </h3>
                
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No activities yet
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {activity.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.user.fullName}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
                              <FiClock size={12} />
                              {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                          {activity.oldValue && activity.newValue && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="line-through">{activity.oldValue}</span>
                              {' → '}
                              <span className="font-medium text-primary-600 dark:text-primary-400">
                                {activity.newValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <p>Created by {lead.createdBy.fullName} on {format(new Date(lead.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                <p>Last updated: {format(new Date(lead.updatedAt), 'MMMM dd, yyyy HH:mm')}</p>
                {lead.lastActivityAt && (
                  <p>Last activity: {format(new Date(lead.lastActivityAt), 'MMMM dd, yyyy HH:mm')}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Lead Conversion Drawer */}
      <LeadConversionDrawer
        isOpen={showConversionDrawer}
        onClose={() => setShowConversionDrawer(false)}
        lead={lead}
        workspaceId={workspaceId}
        onConversionSuccess={(response) => {
          onClose()
          if (onLeadConverted) {
            onLeadConverted(response)
          }
        }}
      />
    </AnimatePresence>
  )
}

export default LeadDetailsDrawer
