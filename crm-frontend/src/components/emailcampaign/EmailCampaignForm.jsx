import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { emailCampaignService } from '../../services/emailCampaignService'
import { emailCampaignSchema } from '../../schemas/emailCampaignSchemas'

const initial = (campaign) => ({ name: campaign?.name || '', description: campaign?.description || '', subject: campaign?.subject || '', templateId: campaign?.templateId ? String(campaign.templateId) : '', recipientMode: 'segment', segmentId: '', recipients: '', scheduledAt: '' })

export default function EmailCampaignForm({ campaign, onSuccess }) {
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => initial(campaign))
  const [errors, setErrors] = useState({})
  const { data: templatesResponse } = useQuery({ queryKey: ['email-templates', currentWorkspace?.id], queryFn: () => emailCampaignService.listTemplates(currentWorkspace.id), enabled: !!currentWorkspace?.id })
  const { data: segmentsResponse } = useQuery({ queryKey: ['email-segments', currentWorkspace?.id], queryFn: () => emailCampaignService.listSegments(currentWorkspace.id), enabled: !!currentWorkspace?.id })
  const templates = templatesResponse?.content || []
  const segments = segmentsResponse?.content || []
  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { name: data.name, description: data.description || null, subject: data.subject, templateId: Number(data.templateId), contentType: 'TEMPLATE', isActive: true }
      const saved = campaign ? await emailCampaignService.updateCampaign(currentWorkspace.id, campaign.id, payload) : await emailCampaignService.createCampaign(currentWorkspace.id, payload)
      const campaignId = saved?.id || campaign?.id
      if (!campaign && campaignId) {
        const recipients = data.recipientMode === 'segment'
          ? { segmentId: Number(data.segmentId), replaceExisting: false }
          : { recipients: data.recipients.split(/[\n,]+/).map((email) => ({ email: email.trim() })).filter(({ email }) => email), replaceExisting: false }
        await emailCampaignService.addRecipients(currentWorkspace.id, campaignId, recipients)
        if (data.scheduledAt) await emailCampaignService.scheduleCampaign(currentWorkspace.id, campaignId, { scheduledAt: new Date(data.scheduledAt).toISOString(), retryCount: 3 })
      }
      return saved
    },
    onSuccess: () => { toast.success(campaign ? 'Campaign updated successfully' : 'Campaign created successfully'); queryClient.invalidateQueries({ queryKey: ['email-campaigns'] }); onSuccess() },
    onError: (error) => toast.error(error?.message || 'Unable to save campaign'),
  })
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = (event) => {
    event.preventDefault()
    const result = emailCampaignSchema.safeParse(form)
    if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))); return }
    setErrors({}); mutation.mutate(result.data)
  }
  const fieldClass = 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white'
  const error = (name) => errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>
  return <form onSubmit={submit} className="space-y-4">
    <div><label htmlFor="campaign-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Campaign name *</label><input id="campaign-name" name="name" value={form.name} onChange={change} maxLength="255" className={fieldClass} />{error('name')}</div>
    <div><label htmlFor="campaign-subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email subject *</label><input id="campaign-subject" name="subject" value={form.subject} onChange={change} maxLength="255" className={fieldClass} />{error('subject')}</div>
    <div><label htmlFor="campaign-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea id="campaign-description" name="description" value={form.description} onChange={change} maxLength="2000" rows="3" className={fieldClass} /></div>
    <div><label htmlFor="campaign-template" className="text-sm font-medium text-gray-700 dark:text-gray-300">Template *</label><select id="campaign-template" name="templateId" value={form.templateId} onChange={change} className={fieldClass}><option value="">Select a template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>{error('templateId')}</div>
    {!campaign && <><fieldset><legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients *</legend><div className="mt-2 flex gap-4 text-sm text-gray-700 dark:text-gray-300"><label><input type="radio" name="recipientMode" value="segment" checked={form.recipientMode === 'segment'} onChange={change} className="mr-2" />Saved segment</label><label><input type="radio" name="recipientMode" value="manual" checked={form.recipientMode === 'manual'} onChange={change} className="mr-2" />Manual emails</label></div></fieldset>
    {form.recipientMode === 'segment' ? <div><label htmlFor="campaign-segment" className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipient segment</label><select id="campaign-segment" name="segmentId" value={form.segmentId} onChange={change} className={fieldClass}><option value="">Select a segment</option>{segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name} ({segment.leadCount || 0})</option>)}</select>{error('segmentId')}</div> : <div><label htmlFor="campaign-recipients" className="text-sm font-medium text-gray-700 dark:text-gray-300">Emails</label><textarea id="campaign-recipients" name="recipients" value={form.recipients} onChange={change} placeholder="name@example.com, another@example.com" rows="3" className={fieldClass} />{error('recipients')}</div>}
    <div><label htmlFor="campaign-schedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule send (optional)</label><input id="campaign-schedule" type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={change} className={fieldClass} />{error('scheduledAt')}</div></>}
    <button type="submit" disabled={mutation.isPending} className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}</button>
  </form>
}
