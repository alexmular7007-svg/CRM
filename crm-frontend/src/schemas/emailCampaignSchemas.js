import { z } from 'zod'

export const emailCampaignSchema = z.object({
  name: z.string().trim().min(1, 'Campaign name is required').max(255),
  description: z.string().max(2000).optional(),
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  templateId: z.string().min(1, 'Please select a template'),
  recipientMode: z.enum(['segment', 'manual']),
  segmentId: z.string().optional(),
  recipients: z.string().optional(),
  scheduledAt: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.recipientMode === 'segment' && !data.segmentId) {
    ctx.addIssue({ code: 'custom', path: ['segmentId'], message: 'Please select a recipient segment' })
  }
  if (data.recipientMode === 'manual' && !data.recipients?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['recipients'], message: 'Add at least one recipient email' })
  }
  if (data.scheduledAt && new Date(data.scheduledAt) <= new Date()) {
    ctx.addIssue({ code: 'custom', path: ['scheduledAt'], message: 'Schedule time must be in the future' })
  }
})
