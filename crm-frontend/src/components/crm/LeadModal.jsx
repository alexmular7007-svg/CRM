import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLeadSchema, updateLeadSchema } from '../../schemas/crmSchemas'
import { FiX, FiUser, FiMail, FiPhone, FiBriefcase, FiDollarSign, FiCalendar, FiTag } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const LeadModal = ({ isOpen, onClose, onSubmit, lead, workspaceId, workspaceMembers, initialStatus }) => {
  const isEditMode = !!lead
  const [tags, setTags] = useState(lead?.tags || [])
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(isEditMode ? updateLeadSchema : createLeadSchema),
    defaultValues: lead ? {
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      position: lead.position || '',
      dealValue: lead.dealValue || 0,
      status: lead.status,
      priority: lead.priority,
      assignedToId: lead.assignedTo?.id || null,
      notes: lead.notes || '',
      expectedCloseDate: lead.expectedCloseDate || null,
    } : {
      status: initialStatus || 'LEAD',
      priority: 'MEDIUM',
      dealValue: 0,
      workspaceId: workspaceId,
    }
  })

  useEffect(() => {
    if (lead) {
      setTags(lead.tags || [])
    } else {
      setTags([])
    }
  }, [lead])

  const handleFormSubmit = async (data) => {
    const submitData = {
      ...data,
      tags,
      workspaceId: isEditMode ? undefined : workspaceId,
    }
    
    await onSubmit(submitData)
    reset()
    setTags([])
    onClose()
  }

  const handleAddTag = (e) => {
    e.preventDefault()
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const getMemberUserId = (member) => member.user?.id ?? member.userId
  const getMemberName = (member) => member.user?.fullName ?? member.userName

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Lead' : 'Create New Lead'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiUser className="inline mr-2" />
                  Name *
                </label>
                <input
                  {...register('name')}
                  className="input"
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiMail className="inline mr-2" />
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiPhone className="inline mr-2" />
                  Phone
                </label>
                <input
                  {...register('phone')}
                  className="input"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiBriefcase className="inline mr-2" />
                  Company
                </label>
                <input
                  {...register('company')}
                  className="input"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <input
                  {...register('position')}
                  className="input"
                  placeholder="CEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiDollarSign className="inline mr-2" />
                  Deal Value
                </label>
                <input
                  {...register('dealValue', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="10000"
                />
                {errors.dealValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.dealValue.message}</p>
                )}
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select {...register('status')} className="input">
                  <option value="LEAD">Lead</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <select {...register('priority')} className="input">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned To
                </label>
                <select {...register('assignedToId', { valueAsNumber: true })} className="input">
                  <option value="">Unassigned</option>
                  {workspaceMembers?.map((member) => (
                    <option key={getMemberUserId(member)} value={getMemberUserId(member)}>
                      {getMemberName(member)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiCalendar className="inline mr-2" />
                Expected Close Date
              </label>
              <Controller
                control={control}
                name="expectedCloseDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    dateFormat="yyyy-MM-dd"
                    className="input w-full"
                    placeholderText="Select date"
                    minDate={new Date()}
                  />
                )}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FiTag className="inline mr-2" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                  className="input flex-1"
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary-900 dark:hover:text-primary-200"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="input"
                placeholder="Add notes about this lead..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update Lead' : 'Create Lead'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default LeadModal
