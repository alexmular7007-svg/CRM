import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FiX, FiBriefcase, FiUsers, FiLoader, FiCheckCircle, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { convertLeadToProject } from '../../services/crmService'
import { workspaceService } from '../../services/workspaceService'

const LeadConversionDrawer = ({ isOpen, onClose, lead, workspaceId, onConversionSuccess }) => {
  const [formData, setFormData] = useState({
    projectName: lead?.name ? `${lead.name} - Implementation` : '',
    projectManagerId: null,
    memberIds: [],
    description: lead?.notes || '',
    color: '#3b82f6',
  })

  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [conversionResult, setConversionResult] = useState(null)

  // Fetch active workspace members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId && isOpen,
  })

  // Filter active members (deletedAt is null)
  const activeMembers = (membersData?.content ?? membersData ?? []).filter(
    member => !member.deletedAt && member.userId !== null
  )

  const projectManager = activeMembers.find(m => m.userId === formData.projectManagerId)

  // Conversion mutation
  const conversionMutation = useMutation({
    mutationFn: () => convertLeadToProject(lead.id, formData),
    onSuccess: (response) => {
      setConversionResult(response)
      toast.success(`Project "${response.projectName}" created successfully!`)
      if (onConversionSuccess) {
        onConversionSuccess(response)
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to convert lead'
      toast.error(message)
    },
  })

  const handleAddMember = (memberId) => {
    if (!formData.memberIds.includes(memberId)) {
      setFormData(prev => ({
        ...prev,
        memberIds: [...prev.memberIds, memberId]
      }))
    }
    setShowMemberSelect(false)
  }

  const handleRemoveMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.filter(id => id !== memberId)
    }))
  }

  const handleConvert = () => {
    // Validation
    if (!formData.projectName.trim()) {
      toast.error('Project name is required')
      return
    }
    if (!formData.projectManagerId) {
      toast.error('Please select a project manager')
      return
    }

    conversionMutation.mutate()
  }

  const isFormValid = formData.projectName.trim() && formData.projectManagerId

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
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Convert Lead to Project
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lead.name} ({lead.company})
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Success State */}
            {conversionResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-4"
              >
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FiCheckCircle className="text-green-600 dark:text-green-400" size={32} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      ✓ Project created
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
                      {conversionResult.projectName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The lead has been successfully converted into a client project.
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Members added: <span className="text-primary-600 dark:text-primary-400">{conversionResult.membersAdded}</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose()
                      // Use existing Kanban route
                      window.location.href = `/projects/${conversionResult.projectId}/kanban`
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Open Project
                    <FiArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Form Content (hidden if conversion succeeded) */}
            {!conversionResult && (
              <div className="p-6 space-y-6">
                {/* Project Name */}
                <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="e.g., Acme Corp - Implementation"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add project details..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              {/* Project Manager */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Manager *
                </label>
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FiLoader className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.projectManagerId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        projectManagerId: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                    >
                      <option value="">Select a project manager...</option>
                      {activeMembers.map(member => (
                        <option key={member.userId} value={member.userId}>
                          {member.userName} ({member.userEmail})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {projectManager && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                      {projectManager.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {projectManager.userName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {projectManager.userEmail}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Members */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Team Members
                </label>
                <button
                  onClick={() => setShowMemberSelect(!showMemberSelect)}
                  disabled={membersLoading || conversionMutation.isPending}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiUsers size={16} />
                    Add Members
                  </span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    {formData.memberIds.length}
                  </span>
                </button>

                {/* Member Select Dropdown */}
                {showMemberSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg space-y-2 max-h-40 overflow-y-auto"
                  >
                    {activeMembers.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                        No members available
                      </p>
                    ) : (
                      activeMembers.map(member => (
                        <label
                          key={member.userId}
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.memberIds.includes(member.userId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleAddMember(member.userId)
                              } else {
                                handleRemoveMember(member.userId)
                              }
                            }}
                            disabled={formData.projectManagerId === member.userId}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {member.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {member.userEmail}
                            </p>
                          </div>
                          {member.userProfileImageUrl && (
                            <img
                              src={member.userProfileImageUrl}
                              alt={member.userName}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                        </label>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Selected Members */}
                {formData.memberIds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.memberIds.map(memberId => {
                      const member = activeMembers.find(m => m.userId === memberId)
                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {member?.userName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {member?.userName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(memberId)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Project Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Project Color
                </label>
                <div className="flex gap-3">
                  {[
                    '#3b82f6', // blue
                    '#ef4444', // red
                    '#10b981', // green
                    '#f59e0b', // amber
                    '#8b5cf6', // purple
                    '#06b6d4', // cyan
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 dark:border-white ring-2 ring-offset-2'
                          : 'border-transparent hover:ring-2 ring-offset-2'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiBriefcase size={16} />
                  What will be created:
                </p>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                  <li>✓ A new Client record (from lead details)</li>
                  <li>✓ A new Project (assigned to {projectManager?.userName || 'selected manager'})</li>
                  <li>✓ A project chat room with team members</li>
                  <li>✓ Project activity log</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={conversionMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvert}
                  disabled={!isFormValid || conversionMutation.isPending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {conversionMutation.isPending ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FiBriefcase size={16} />
                      Convert to Project
                    </>
                  )}
                </button>
              </div>
            </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LeadConversionDrawer
