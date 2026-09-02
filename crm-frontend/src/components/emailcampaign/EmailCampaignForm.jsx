import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { emailCampaignService } from '../../services/emailCampaignService'
import aiEmailGenerationService from '../../services/aiEmailGenerationService'
import AIEmailGenerationForm from './AIEmailGenerationForm'
import GeneratedEmailPreview from './GeneratedEmailPreview'



const initialFormState = {
  // Section 1: Campaign Information
  campaignName: '',
  emailSubject: '',
  description: '',
  
  // Section 2: Email Content
  contentMode: 'create', // 'create', 'existing', or 'ai'
  templateName: '',
  emailHeading: '',
  emailBody: '',
  ctaButtonText: '',
  ctaButtonUrl: '',
  existingTemplateId: '',
  aiGeneratedContent: null, // Stores AI-generated email data
  aiGenerationInputs: null, // Stores the form inputs used for AI generation
  aiGenerationLoading: false,
  
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
  
  useEffect(() => {
    console.log('ðŸ“‹ CAMPAIGN FORM MOUNT')
    return () => console.log('ðŸ“‹ CAMPAIGN FORM UNMOUNT')
  }, [])
  
  // Fetch templates
  const { data: templatesResponse, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
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
  
  // Helper to switch to existing template mode
  const handleSwitchToExisting = async (targetName) => {
    const res = await refetchTemplates()
    const latestTemplates = res.data?.content || templates
    const nameToMatch = (targetName || form.templateName || '').trim().toLowerCase()
    const match = latestTemplates.find((t) => t.name.trim().toLowerCase() === nameToMatch) || latestTemplates[0]
    
    setForm((prev) => ({
      ...prev,
      contentMode: 'existing',
      existingTemplateId: match ? String(match.id) : prev.existingTemplateId,
    }))
    setErrors((prev) => ({ ...prev, templateName: null, existingTemplateId: null }))
    if (match) {
      toast.success(`Switched to existing template: "${match.name}"`)
    }
  }

  // Handle radio toggle for contentMode
  const handleContentModeChange = async (mode) => {
    setForm((prev) => ({ ...prev, contentMode: mode }))
    if (mode === 'existing') {
      const res = await refetchTemplates()
      const latestTemplates = res.data?.content || templates
      const nameToMatch = (form.templateName || '').trim().toLowerCase()
      if (nameToMatch) {
        const match = latestTemplates.find((t) => t.name.trim().toLowerCase() === nameToMatch)
        if (match) {
          setForm((prev) => ({ ...prev, existingTemplateId: String(match.id) }))
        }
      }
    }
  }

  // Handle AI email generation using Phase 11.3 service
  const handleAIGenerate = async (aiFormData) => {
    console.log("DEBUG_AI_GENERATE_START", aiFormData);
    console.log('1ï¸âƒ£ HANDLE_AI_GENERATE START', aiFormData)
    try {
      setForm((prev) => ({
        ...prev,
        aiGenerationLoading: true,
        aiGenerationInputs: aiFormData,
      }))

      // Call AI generation service with structured error handling
      const response = await aiEmailGenerationService.generateEmail(aiFormData)
      console.log('2ï¸âƒ£ API_RESPONSE_SUCCESS', response)

      if (response?.success) {
        setForm((prev) => ({
          ...prev,
          aiGeneratedContent: response,
          aiGenerationLoading: false,
        }))
        toast.success('Email generated successfully')
      } else {
        throw response
      }
    } catch (error) {
      console.log('âŒ API_RESPONSE_ERROR', error)
      // CRITICAL FIX: Reset aiGeneratedContent BEFORE setting aiGenerationLoading to false
      // This ensures conditional rendering keeps the form visible during error
      setForm((prev) => ({
        ...prev,
        aiGeneratedContent: {
          ...(error?.data || {}),
          success: false,
          error: error?.data?.error || error?.message || error?.details || error?.error || 'Failed to generate email',
        },
        aiGenerationLoading: false,
      }))
      const errorMessage = error?.message || error?.details || error?.error || 'Failed to generate email'
      toast.error(errorMessage)
    }
    console.log('3ï¸âƒ£ HANDLE_AI_GENERATE END')
  }

  // Handle AI email regeneration using Phase 11.3 service
  const handleAIRegenerate = async () => {
    const inputs = form.aiGenerationInputs
    if (!inputs) {
      toast.error('No generation inputs found. Please generate again.')
      return
    }

    try {
      setForm((prev) => ({
        ...prev,
        aiGenerationLoading: true,
      }))

      // Call AI regeneration service
      const response = await aiEmailGenerationService.regenerateEmail(inputs)

      if (response?.success) {
        setForm((prev) => ({
          ...prev,
          aiGeneratedContent: response,
          aiGenerationLoading: false,
        }))
        toast.success('Email regenerated successfully')
      } else {
        throw response // Response has error message
      }
    } catch (error) {
      // CRITICAL FIX: Reset aiGeneratedContent BEFORE setting aiGenerationLoading to false
      // This mirrors the fix in handleAIGenerate for consistency
      setForm((prev) => ({
        ...prev,
        aiGeneratedContent: {
          ...(error?.data || {}),
          success: false,
          error: error?.data?.error || error?.message || error?.details || error?.error || 'Failed to regenerate email',
        },
        aiGenerationLoading: false,
      }))
      const errorMessage = error?.message || error?.details || error?.error || 'Failed to regenerate email'
      toast.error(errorMessage)
    }
  }

  // Phase 11.4: Handle saving AI-generated email as template
  const handleSaveAITemplate = async (editedContent, templateNameInput, options = {}) => {
    if (options.useExisting) {
      // User chose to use existing template instead of creating new one
      await handleSwitchToExisting(templateNameInput)
      return
    }

    if (!templateNameInput?.trim()) {
      toast.error('Template name is required')
      throw new Error('Template name required')
    }

    try {
      // Build template payload from AI-generated content
      // Map: subject â†’ subjectTemplate, bodyHtml â†’ htmlContent, bodyPlainText â†’ plainTextContent
      const templatePayload = {
        name: templateNameInput.trim(),
        description: `AI-generated email template from campaign setup`,
        category: 'CAMPAIGN',
        subjectTemplate: editedContent.subject || form.aiGenerationInputs?.campaignPurpose || 'Generated Email',
        htmlContent: form.aiGeneratedContent?.bodyHtml || '',
        plainTextContent: form.aiGeneratedContent?.bodyPlainText || '',
        variables: [],
        isPublic: false,
      }

      // Call createTemplate service - maps to POST /api/workspaces/{id}/email-templates
      // This endpoint returns 201 CREATED on success or 409 CONFLICT on duplicate name
      const result = await emailCampaignService.createTemplate(currentWorkspace.id, templatePayload)

      // Task 3: Verify template was created by fetching it via GET endpoint
      if (result?.id) {
        const verification = await emailCampaignService.getTemplate(currentWorkspace.id, result.id)

        if (verification?.id) {
          // Success: invalidate templates list and switch to existing template mode
          queryClient.invalidateQueries({ queryKey: ['email-templates', currentWorkspace?.id] })
          setForm((prev) => ({
            ...prev,
            templateName: templateNameInput.trim(),
            existingTemplateId: String(result.id),
            contentMode: 'existing',
          }))
          toast.success(`Template "${templateNameInput}" created and verified successfully!`)
          return
        }
      }

      throw new Error('Template verification failed')
    } catch (error) {
      // Task 2: Handle 409 Conflict response
      const status = error?.response?.status || error?.status
      const errorMsg = error?.response?.data?.message || error?.message || ''
      const isConflict = status === 409 || errorMsg.toLowerCase().includes('already exists')

      if (isConflict) {
        // 409 Conflict: Show conflict modal with [Rename Template] [Use Existing Template] options
        // This preserves the generated content and allows user to choose action
        toast.error(`Template "${templateNameInput}" already exists in this workspace.`, { id: 'conflict' })
        // The conflict modal will be shown via state in GeneratedEmailPreview
        // Re-throw so parent component can handle UI state
      } else {
        toast.error(errorMsg || 'Failed to save template')
      }

      throw error
    }
  }

  // Handle using generated AI email in campaign
  const handleUseAIEmail = (editedContent) => {
    setForm((prev) => ({
      ...prev,
      emailSubject: editedContent.subject || '',
      emailHeading: editedContent.subject || '',
      emailBody: editedContent.bodyHtml || prev.aiGeneratedContent?.bodyHtml || '',
      ctaButtonText: editedContent.ctaText || '',
      ctaButtonUrl: editedContent.ctaUrl || '',
      contentMode: 'create', // Switch to create mode with AI content filled in
    }))
    toast.success('AI-generated email loaded into form')
  }
  

  // Create/Send campaign mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Determine content type and payload
      let templateId = null
      
      if (data.contentMode === 'create') {
        // Create new template first
        const htmlContent = buildHtmlContent(data)
        const templatePayload = {
          name: data.templateName.trim(),
          description: data.description ? `Campaign: ${data.campaignName.trim()} - ${data.description.trim()}` : `Auto-created from campaign: ${data.campaignName.trim()}`,
          category: 'CAMPAIGN',
          subjectTemplate: data.emailSubject.trim(),
          htmlContent,
          plainTextContent: data.emailBody.replace(/<[^>]*>/g, ''),
          variables: [],  // Empty array instead of string
          isPublic: false,
        }
        try {
          const template = await emailCampaignService.createTemplate(currentWorkspace.id, templatePayload)
          templateId = template?.id
          if (!templateId) {
            throw new Error('Failed to create template: no ID returned')
          }
        } catch (error) {
          console.error('Template creation error:', error)
          const status = error?.status || error?.response?.status
          const message = error?.message || error?.response?.data?.message || ''
          const isConflict = status === 409 || message.toLowerCase().includes('already exists')
          
          if (isConflict) {
            // Invalidate templates list so existing templates refresh immediately
            queryClient.invalidateQueries({ queryKey: ['email-templates', currentWorkspace?.id] })
            
            const conflictErr = new Error('TEMPLATE_CONFLICT')
            conflictErr.isConflict = true
            conflictErr.duplicateName = data.templateName
            throw conflictErr
          }
          
          throw new Error(message || 'Failed to create email template')
        }
      } else {
        templateId = Number(data.existingTemplateId)
        if (!templateId) {
          throw new Error('Please select a valid email template')
        }
      }
      
      // Create campaign - ONLY reached if template creation succeeded or existing template chosen
      const campaignPayload = {
        name: data.campaignName.trim(),
        subject: data.emailSubject.trim(),
        description: data.description ? data.description.trim() : null,
        templateId,
        contentType: 'TEMPLATE',
        recipientMode: data.audienceMode.toUpperCase(),
        recipientData: JSON.stringify(getRecipientData(data)),
        status: data.deliveryMode === 'draft' ? 'DRAFT' : 'DRAFT',
        isActive: true,
        ctaButtonText: data.ctaButtonText || null,
        ctaButtonUrl: data.ctaButtonUrl || null,
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
          
          if (emails.length > 0) {
            await emailCampaignService.addRecipients(currentWorkspace.id, campaignId, {
              recipients: emails,
              replaceExisting: true,
            })
          }
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
      console.log('ðŸŽ‰ MUTATION_ON_SUCCESS')
      console.log('ðŸš¨ CALLING_ON_SUCCESS_CALLBACK')
      toast.success(
        form.deliveryMode === 'draft' 
          ? 'Campaign saved as draft' 
          : form.deliveryMode === 'schedule'
          ? 'Campaign scheduled successfully'
          : 'Campaign sent successfully'
      )
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      onSuccess()
      console.log('ðŸš¨ ON_SUCCESS_CALLBACK_RETURNED')
    },
    onError: (error) => {
      if (error?.isConflict || error?.message === 'TEMPLATE_CONFLICT') {
        const dupName = error.duplicateName || form.templateName
        setErrors((prev) => ({
          ...prev,
          templateName: `Template name "${dupName}" already exists in this workspace.`
        }))
        toast.error(`Template "${dupName}" already exists in this workspace.`, { id: 'template-conflict' })
      } else {
        toast.error(error?.message || 'Failed to save campaign')
      }
    },
  })
  
  // The tracked CTA is appended by the backend per recipient, so this stores the message shell once.
  const buildHtmlContent = (data) => {
    const heading = data.emailHeading
      ? `<h1 style="font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">${data.emailHeading}</h1>`
      : ''
    const body = data.emailBody
      ? `<p style="font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">${data.emailBody}</p>`
      : ''
    return `<!doctype html><html><body style="margin:0;padding:32px 12px;background:#f1f5f9;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.08);">${heading}${body}<hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0 18px;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748b;">Sent by your workspace. Please do not reply to this automated message.</p></div></body></html>`
  }

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
    console.log("DEBUG_CAMPAIGN_FORM_SUBMIT");
    console.log('ðŸ“ FORM_SUBMIT_CLICKED')
    
    // Prevent submission if mutation is already running
    if (mutation.isPending) return;
    
    // Validation
    const newErrors = {}
    if (!form.campaignName.trim()) newErrors.campaignName = 'Campaign name is required'
    if (!form.emailSubject.trim()) newErrors.emailSubject = 'Email subject is required'
    
    // Content validation
    if (form.contentMode === 'create') {
      if (!form.templateName.trim()) newErrors.templateName = 'Template name is required'
      if (!form.emailHeading.trim()) newErrors.emailHeading = 'Email heading is required'
      if (!form.emailBody.trim()) newErrors.emailBody = 'Email body is required'
    } else if (form.contentMode === 'ai') {
      if (!form.aiGeneratedContent) newErrors.aiGeneratedContent = 'Please generate an email with AI first'
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
    console.log('4ï¸âƒ£ MUTATION_MUTATE_CALLED')
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
              placeholder="e.g., ðŸŽ‰ Get 30% OFF This Week"
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
              onChange={() => handleContentModeChange('create')}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Create New Template</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="contentMode"
              value="existing"
              checked={form.contentMode === 'existing'}
              onChange={() => handleContentModeChange('existing')}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use Existing Template</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="contentMode"
              value="ai"
              checked={form.contentMode === 'ai'}
              onChange={() => handleContentModeChange('ai')}
              className="w-4 h-4 text-violet-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">ðŸ¤– Generate with AI</span>
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
                className={`${fieldClass} ${errors.templateName ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.templateName && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{errors.templateName}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchToExisting(form.templateName)}
                      className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                    >
                      Use Existing Template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrors((prev) => ({ ...prev, templateName: null }))
                        document.getElementById('templateName')?.focus()
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-gray-300"
                    >
                      Rename Template
                    </button>
                  </div>
                </div>
              )}
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
        ) : form.contentMode === 'ai' ? (
          <div className="mt-4 space-y-4">
            {form.aiGenerationLoading ? (
              // Show form with loading overlay when generating
              <AIEmailGenerationForm
                onGenerate={handleAIGenerate}
                onCancel={() => handleContentModeChange('create')}
                isLoading={form.aiGenerationLoading}
              />
            ) : form.aiGeneratedContent?.success ? (
              // Show preview when generation succeeded
              <GeneratedEmailPreview
                generated={form.aiGeneratedContent}
                onRegenerate={handleAIRegenerate}
                onSaveTemplate={(editedContent, templateName) => {
                  handleSaveAITemplate(editedContent, templateName)
                }}
                onUseInCampaign={handleUseAIEmail}
                isLoading={form.aiGenerationLoading}
              />
            ) : form.aiGeneratedContent?.success === false ? (
              // Show preview with error message when generation failed
              <GeneratedEmailPreview
                generated={form.aiGeneratedContent}
                onRegenerate={handleAIRegenerate}
                onSaveTemplate={(editedContent, templateName) => {
                  handleSaveAITemplate(editedContent, templateName)
                }}
                onUseInCampaign={handleUseAIEmail}
                isLoading={form.aiGenerationLoading}
              />
            ) : (
              // Show form when no generation attempted yet
              <AIEmailGenerationForm
                onGenerate={handleAIGenerate}
                onCancel={() => handleContentModeChange('create')}
                isLoading={form.aiGenerationLoading}
              />
            )}
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





