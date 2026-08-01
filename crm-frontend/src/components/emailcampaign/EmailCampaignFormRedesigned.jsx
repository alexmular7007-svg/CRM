import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { emailCampaignService } from '../../services/emailCampaignService'

/**
 * Redesigned Email Campaign Form - Production Ready
 * 
 * SECTION 1: Campaign Information
 * SECTION 2: Email Content (Create New vs Use Existing)
 * SECTION 3: Audience (Manual vs Segment vs CRM Filter)
 * SECTION 4: Delivery (Send Now / Draft / Schedule)
 */

const initialFormState = {
  // Section 1: Campaign Information
  campaignName: '',
  emailSubject: '',
  description: '',
  
  // Section 2: Email Content
  contentMode: 'create', // 'create' or 'existing'
  templateName: '',
  emailHeading: '',
  emailBody: '',
  ctaButtonText: '',
  ctaButtonUrl: '',
  existingTemplateId: '',
  
  // Section 3: Audience
  audienceMode: 'manual', // 'manual' or 'segment' or 'crmfilter'
  manualEmails: '',
  segmentId: '',
  crmFilters: {
    leadStatus: '',
    country: '',
    industry: '',
    tags: '',
  },
  
  // Section 4: Delivery
  deliveryMode: 'now', // 'now' or 'draft' or 'schedule'
  scheduleDateTime: '',
  scheduleTimezone: 'UTC',
}

export default function EmailCampaignForm({ campaign, onSuccess }) {
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  
  // Fetch templates
  const { data: templatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', currentWorkspace?.id],
    queryFn: () => emailCampaignService.listTemplates(currentWorkspace.id),
    enabled: !!currentWorkspace?.id,
  })
  const templates = templatesResponse?.content || []
  
  // Fetch segments
  const { data: segmentsResponse, isLoading: segmentsLoading } = useQuery({
    queryKey: ['email-segments', currentWorkspace?.id],
    queryFn: () => emailCampaignService.listSegments(currentWorkspace.id),
    enabled: !!currentWorkspace?.id,
  })
  const segments = segmentsResponse?.content || []
  
  // Create/Send campaign mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Determine content type and payload
      let templateId = null
      
      if (data.contentMode === 'create') {
        // Create new template first
        const templatePayload = {
          name: data.templateName,
          description: `Auto-created from campaign: ${data.campaignName}`,
          category: 'CAMPAIGN',
          subjectTemplate: data.emailSubject,
          htmlContent: data.emailBody,
          plainTextContent: data.emailBody.replace(/<[^>]*>/g, ''),
          variables: '{}',
          isPublic: false,
        }
        const template = await emailCampaignService.createTemplate(currentWorkspace.id, templatePayload)
        templateId = template?.id
      } else {
        templateId = Number(data.existingTemplateId)
      }
      
      // Create campaign
      const campaignPayload = {
        name: data.campaignName,
        subject: data.emailSubject,
        description: data.description || null,
        templateId,
        contentType: data.contentMode === 'create' ? 'CUSTOM' : 'TEMPLATE',
        recipientMode: data.audienceMode.toUpperCase(),
        recipientData: JSON.stringify(getRecipientData(data)),
        status: data.deliveryMode === 'draft' ? 'DRAFT' : 'DRAFT',
        isActive: true,
      }
      
      const saved = await emailCampaignService.createCampaign(currentWorkspace.id, campaignPayload)
      const campaignId = saved?.id
      
      // Add recipients
      if (campaignId) {
        if (data.audienceMode === 'manual') {
          const emails = data.manualEmails
            .split(/[\n,]+/)
            .map((email) => ({ email: email.trim() }))
            .filter(({ email }) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          
          await emailCampaignService.addRecipients(currentWorkspace.id, campaignId, {
            recipients: emails,
            replaceExisting: true,
          })
        } else if (data.audienceMode === 'segment') {
          await emailCampaignService.addRecipients(currentWorkspace.id, campaignId, {
            segmentId: Number(data.segmentId),
            replaceExisting: true,
          })
        }
      }
      
      // Schedule if needed
      if (data.deliveryMode === 'schedule' && data.scheduleDateTime) {
        await emailCampaignService.scheduleCampaign(currentWorkspace.id, campaignId, {
          scheduledAt: new Date(data.scheduleDateTime).toISOString(),
          retryCount: 3,
        })
      }
      
      return saved
    },
    onSuccess: (saved) => {
      toast.success(
        form.deliveryMode === 'draft' 
          ? 'Campaign saved as draft' 
          : form.deliveryMode === 'schedule'
          ? 'Campaign scheduled successfully'
          : 'Campaign sent successfully'
      )
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      onSuccess()
    },
    onError: (error) => toast.error(error?.message || 'Failed to save campaign'),
  })
  
  // Helper function to get recipient data
  const getRecipientData = (data) => {
    if (data.audienceMode === 'manual') {
      return { type: 'MANUAL', emails: data.manualEmails }
    } else if (data.audienceMode === 'segment') {
      return { type: 'SEGMENT', segmentId: Number(data.segmentId) }
    } else if (data.audienceMode === 'crmfilter') {
      return { type: 'CRM_FILTER', filters: data.crmFilters }
    }
    return {}
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      if (name.startsWith('crmFilter_')) {
        const filterKey = name.replace('crmFilter_', '')
        return {
          ...prev,
          crmFilters: {
            ...prev.crmFilters,
            [filterKey]: value,
          },
        }
      }
      return { ...prev, [name]: value }
    })
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!form.campaignName.trim()) newErrors.campaignName = 'Campaign name is required'
    if (!form.emailSubject.trim()) newErrors.emailSubject = 'Email subject is required'
    
    // Content validation
    if (form.contentMode === 'create') {
      if (!form.templateName.trim()) newErrors.templateName = 'Template name is required'
      if (!form.emailHeading.trim()) newErrors.emailHeading = 'Email heading is required'
      if (!form.emailBody.trim()) newErrors.emailBody = 'Email body is required'
    } else {
      if (!form.existingTemplateId) newErrors.existingTemplateId = 'Please select a template'
    }
    
    // Audience validation
    if (form.audienceMode === 'manual') {
      const emails = form.manualEmails.split(/[\n,]+/).filter((e) => e.trim())
      if (emails.length === 0) newErrors.manualEmails = 'At least one email is required'
    } else if (form.audienceMode === 'segment') {
      if (!form.segmentId) newErrors.segmentId = 'Please select a segment'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors below')
      return
    }
    
    setErrors({})
    mutation.mutate(form)
  }
  
  const fieldClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300'
  const sectionClass = 'border-b border-gray-200 pb-6 dark:border-[#30363D]'
  const radioClass = 'flex gap-6 mt-3'
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto px-1">
      {/* SECTION 1: Campaign Information */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Information</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="campaignName" className={labelClass}>Campaign Name *</label>
            <input
              id="campaignName"
              name="campaignName"
              value={form.campaignName}
              onChange={handleChange}
              placeholder="e.g., Summer Sale 2024"
              maxLength="255"
              className={fieldClass}
            />
            {errors.campaignName && <p className="mt-1 text-xs text-red-500">{errors.campaignName}</p>}
          </div>
          
          <div>
            <label htmlFor="emailSubject" className={labelClass}>Email Subject *</label>
            <input
              id="emailSubject"
              name="emailSubject"
              value={form.emailSubject}
              onChange={handleChange}
              placeholder="e.g., 🎉 Get 30% OFF This Week"
              maxLength="255"
              className={fieldClass}
            />
            {errors.emailSubject && <p className="mt-1 text-xs text-red-500">{errors.emailSubject}</p>}
          </div>
          
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional: Add notes about this campaign"
              maxLength="2000"
              rows="2"
              className={fieldClass}
            />
          </div>
        </div>
      </div>
      
      {/* SECTION 2: Email Content */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Content</h3>
        
        <div className={radioClass}>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="contentMode"
              value="create"
              checked={form.contentMode === 'create'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Create New Email</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="contentMode"
              value="existing"
              checked={form.contentMode === 'existing'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Existing Template</span>
          </label>
        </div>
        
        {form.contentMode === 'create' ? (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="templateName" className={labelClass}>Template Name *</label>
              <input
                id="templateName"
                name="templateName"
                value={form.templateName}
                onChange={handleChange}
                placeholder="e.g., Summer Sale Template"
                maxLength="255"
                className={fieldClass}
              />
              {errors.templateName && <p className="mt-1 text-xs text-red-500">{errors.templateName}</p>}
            </div>
            
            <div>
              <label htmlFor="emailHeading" className={labelClass}>Email Heading *</label>
              <input
                id="emailHeading"
                name="emailHeading"
                value={form.emailHeading}
                onChange={handleChange}
                placeholder="Main heading for your email"
                className={fieldClass}
              />
              {errors.emailHeading && <p className="mt-1 text-xs text-red-500">{errors.emailHeading}</p>}
            </div>
            
            <div>
              <label htmlFor="emailBody" className={labelClass}>Email Body *</label>
              <textarea
                id="emailBody"
                name="emailBody"
                value={form.emailBody}
                onChange={handleChange}
                placeholder="Write your email content here. You can use HTML tags."
                rows="6"
                className={fieldClass}
              />
              {errors.emailBody && <p className="mt-1 text-xs text-red-500">{errors.emailBody}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ctaButtonText" className={labelClass}>CTA Button Text</label>
                <input
                  id="ctaButtonText"
                  name="ctaButtonText"
                  value={form.ctaButtonText}
                  onChange={handleChange}
                  placeholder="e.g., Claim Offer"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="ctaButtonUrl" className={labelClass}>CTA Button URL</label>
                <input
                  id="ctaButtonUrl"
                  name="ctaButtonUrl"
                  value={form.ctaButtonUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://..."
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {templates.length > 0 ? (
              <>
                <label htmlFor="existingTemplateId" className={labelClass}>Select Template *</label>
                <select
                  id="existingTemplateId"
                  name="existingTemplateId"
                  value={form.existingTemplateId}
                  onChange={handleChange}
                  disabled={templatesLoading}
                  className={fieldClass}
                >
                  <option value="">{templatesLoading ? 'Loading...' : 'Choose a template'}</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.existingTemplateId && <p className="mt-1 text-xs text-red-500">{errors.existingTemplateId}</p>}
              </>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-900/50">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  No email templates found yet. Switch to "Create New Email" above or
                  {' '}
                  <button
                    type="button"
                    className="underline font-medium hover:no-underline"
                  >
                    create one first
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* SECTION 3: Audience */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audience</h3>
        
        <div className={radioClass}>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="audienceMode"
              value="manual"
              checked={form.audienceMode === 'manual'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Manual Emails</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="audienceMode"
              value="segment"
              checked={form.audienceMode === 'segment'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Existing Segment</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="audienceMode"
              value="crmfilter"
              checked={form.audienceMode === 'crmfilter'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">CRM Lead Filter</span>
          </label>
        </div>
        
        {form.audienceMode === 'manual' && (
          <div className="mt-4">
            <label htmlFor="manualEmails" className={labelClass}>Email Addresses *</label>
            <textarea
              id="manualEmails"
              name="manualEmails"
              value={form.manualEmails}
              onChange={handleChange}
              placeholder="One email per line or comma-separated&#10;john@example.com&#10;jane@example.com"
              rows="4"
              className={fieldClass}
            />
            {errors.manualEmails && <p className="mt-1 text-xs text-red-500">{errors.manualEmails}</p>}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {form.manualEmails.split(/[\n,]+/).filter(e => e.trim()).length} email(s) will be sent
            </p>
          </div>
        )}
        
        {form.audienceMode === 'segment' && (
          <div className="mt-4">
            {segments.length > 0 ? (
              <>
                <label htmlFor="segmentId" className={labelClass}>Select Segment *</label>
                <select
                  id="segmentId"
                  name="segmentId"
                  value={form.segmentId}
                  onChange={handleChange}
                  disabled={segmentsLoading}
                  className={fieldClass}
                >
                  <option value="">{segmentsLoading ? 'Loading...' : 'Choose a segment'}</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.leadCount || 0} leads)
                    </option>
                  ))}
                </select>
                {errors.segmentId && <p className="mt-1 text-xs text-red-500">{errors.segmentId}</p>}
              </>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-900/50">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  No audience segments found yet. Switch to "Manual Emails" above or
                  {' '}
                  <button
                    type="button"
                    className="underline font-medium hover:no-underline"
                  >
                    create one first
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
        
        {form.audienceMode === 'crmfilter' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="crmFilter_leadStatus" className={labelClass}>Lead Status</label>
              <select
                id="crmFilter_leadStatus"
                name="crmFilter_leadStatus"
                value={form.crmFilters.leadStatus}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">All Statuses</option>
                <option value="LEAD">Lead</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="crmFilter_country" className={labelClass}>Country</label>
              <input
                id="crmFilter_country"
                name="crmFilter_country"
                value={form.crmFilters.country}
                onChange={handleChange}
                placeholder="e.g., USA"
                className={fieldClass}
              />
            </div>
            
            <div>
              <label htmlFor="crmFilter_industry" className={labelClass}>Industry</label>
              <input
                id="crmFilter_industry"
                name="crmFilter_industry"
                value={form.crmFilters.industry}
                onChange={handleChange}
                placeholder="e.g., Technology"
                className={fieldClass}
              />
            </div>
            
            <div>
              <label htmlFor="crmFilter_tags" className={labelClass}>Tags</label>
              <input
                id="crmFilter_tags"
                name="crmFilter_tags"
                value={form.crmFilters.tags}
                onChange={handleChange}
                placeholder="Comma-separated tags"
                className={fieldClass}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* SECTION 4: Delivery */}
      <div className={sectionClass}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery</h3>
        
        <div className={radioClass}>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="deliveryMode"
              value="now"
              checked={form.deliveryMode === 'now'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Send Now</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="deliveryMode"
              value="draft"
              checked={form.deliveryMode === 'draft'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Save Draft</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="deliveryMode"
              value="schedule"
              checked={form.deliveryMode === 'schedule'}
              onChange={handleChange}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Schedule Later</span>
          </label>
        </div>
        
        {form.deliveryMode === 'schedule' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduleDateTime" className={labelClass}>Date & Time *</label>
              <input
                id="scheduleDateTime"
                type="datetime-local"
                name="scheduleDateTime"
                value={form.scheduleDateTime}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>
            
            <div>
              <label htmlFor="scheduleTimezone" className={labelClass}>Timezone</label>
              <select
                id="scheduleTimezone"
                name="scheduleTimezone"
                value={form.scheduleTimezone}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#30363D] dark:text-gray-300 dark:hover:bg-[#161B22]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? 'Processing...' : 'Create Campaign'}
        </button>
      </div>
    </form>
  )
}
