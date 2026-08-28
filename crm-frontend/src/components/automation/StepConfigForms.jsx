import { useState, useEffect } from 'react'
import { Sparkles, Monitor, Smartphone, RefreshCw, Check, Edit3, Lock, AlertCircle } from 'lucide-react'
import { emailCampaignService } from '../../services/emailCampaignService'
import { aiEmailGenerationService } from '../../services/aiEmailGenerationService'
import toast from 'react-hot-toast'

const VARIABLES = ['{{lead.name}}', '{{lead.email}}', '{{lead.company}}']

/**
 * Enhanced Send Email Step Configuration featuring ✨ AI Email Agent & Email Preview
 */
export function SendEmailConfig({ config = {}, onChange, workspaceId }) {
  const [subject, setSubject] = useState(config.subject || '')
  const [emailTemplateId, setEmailTemplateId] = useState(config.emailTemplateId || '')
  const [emailCampaignId, setEmailCampaignId] = useState(config.emailCampaignId || '')
  const [emailBody, setEmailBody] = useState(config.emailBody || '')
  const [campaigns, setCampaigns] = useState([])
  const recipientField = 'email' // Locked to lead email per backend contract

  // AI Email Agent State
  const [showAiAgent, setShowAiAgent] = useState(false)
  const [goal, setGoal] = useState('Welcome this new lead and introduce our product')
  const [audience, setAudience] = useState('New B2B Lead')
  const [tone, setTone] = useState('Professional')
  const [length, setLength] = useState('Medium')
  const [ctaText, setCtaText] = useState('Book a Demo')
  const [ctaUrl, setCtaUrl] = useState('https://example.com/demo')
  const [keyPoints, setKeyPoints] = useState('')
  const [availableTones, setAvailableTones] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState(null)
  const [aiError, setAiError] = useState(null)

  // Preview State
  const [previewMode, setPreviewMode] = useState('desktop') // 'desktop' | 'mobile'

  useEffect(() => {
    if (!workspaceId) return
    emailCampaignService
      .listCampaigns(workspaceId, { size: 100 })
      .then((response) => setCampaigns(response?.content || response || []))
      .catch(() => setCampaigns([]))

    aiEmailGenerationService
      .getTones()
      .then((tones) => setAvailableTones(tones || ['Professional', 'Friendly', 'Urgent', 'Casual']))
      .catch(() => setAvailableTones(['Professional', 'Friendly', 'Urgent', 'Casual']))
  }, [workspaceId])

  useEffect(() => {
    onChange({
      subject,
      emailBody,
      emailTemplateId: emailTemplateId ? parseInt(emailTemplateId) : null,
      emailCampaignId: emailCampaignId ? parseInt(emailCampaignId) : null,
      recipientField: 'email',
    })
  }, [subject, emailBody, emailTemplateId, emailCampaignId, onChange])

  const insertVariable = (varName) => {
    setSubject((prev) => `${prev} ${varName}`.trim())
  }

  const handleGenerateEmail = async () => {
    if (!goal.trim()) {
      toast.error('Please specify a goal for the email')
      return
    }
    setIsGenerating(true)
    setAiError(null)

    try {
      const response = await aiEmailGenerationService.generateEmail({
        purpose: goal.trim(),
        targetAudience: audience.trim() || 'Leads',
        productService: 'Product / Service',
        tone,
        length,
        ctaText: ctaText.trim() || 'Learn More',
        ctaUrl: ctaUrl.trim() || 'https://example.com',
        keyPoints: keyPoints.trim() || undefined,
      })

      if (response?.success === false || response?.data?.error) {
        setAiError(response?.data?.error || response?.error || 'AI generation failed')
        toast.error('AI Generation could not complete')
      } else {
        const result = response?.data || response
        setGeneratedEmail({
          subject: result.subject || `Welcome {{lead.name}} — Let's get started`,
          bodyHtml: result.bodyHtml || result.bodyPlainText || '',
          bodyPlainText: result.bodyPlainText || '',
        })
        toast.success('✨ Email content generated successfully!')
      }
    } catch (err) {
      const errMsg = err?.details || err?.message || 'Failed to generate email via AI'
      setAiError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyGeneratedEmail = () => {
    if (!generatedEmail) return
    setSubject(generatedEmail.subject)
    setEmailBody(generatedEmail.bodyHtml || generatedEmail.bodyPlainText)
    toast.success('Applied generated email to step configuration')
  }

  // Render variable chips highlighted in text
  const renderTextWithVariableChips = (text) => {
    if (!text) return <span className="text-gray-400 italic">No content</span>

    const regex = /({{lead\.[a-zA-Z0-9_]+}})/g
    const parts = text.split(regex)

    return parts.map((part, idx) => {
      if (part.match(regex)) {
        return (
          <span
            key={idx}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-mono text-xs font-bold border border-violet-200 dark:border-violet-700"
          >
            {part}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Campaign & Recipient Selection */}
      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Email Campaign
          </label>
          <select
            value={emailCampaignId}
            onChange={(e) => setEmailCampaignId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select an existing campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} (#{campaign.id})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Link this step to an existing email campaign.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between">
            <span>Recipient Field</span>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-normal flex items-center gap-1">
              <Lock size={12} /> Supported: email
            </span>
          </label>
          <div className="mt-1 flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0D1117] text-sm text-gray-700 dark:text-gray-300">
            <Lock size={14} className="text-gray-400" />
            <span className="font-mono text-xs font-semibold">Lead Email (recipientField = email)</span>
          </div>
        </div>
      </div>

      {/* 2. Subject Line & Dynamic Variables */}
      <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Subject Line
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Welcome {{lead.name}} — Let's get started"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
        />

        {/* Variable Chips */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1.5">
            Supported Variable Chips:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-mono border border-violet-200 dark:border-violet-800 transition-colors"
              >
                + {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ✨ AI Email Agent UI */}
      <div className="rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-b from-violet-50/50 to-purple-50/20 dark:from-violet-950/20 dark:to-purple-950/10 p-4 space-y-4">
        <button
          type="button"
          onClick={() => setShowAiAgent(!showAiAgent)}
          className="w-full flex items-center justify-between font-bold text-sm text-violet-900 dark:text-violet-200"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="text-violet-600 dark:text-violet-400 animate-pulse" size={18} />
            ✨ AI Email Agent
          </span>
          <span className="text-xs font-normal text-violet-600 dark:text-violet-400 underline">
            {showAiAgent ? 'Hide Agent' : 'Open Agent'}
          </span>
        </button>

        {showAiAgent && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                What is the goal?
              </label>
              <textarea
                rows={2}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Welcome this new lead and introduce our product..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="New B2B Lead"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
                >
                  {(availableTones.length > 0 ? availableTones : ['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal', 'Persuasive']).map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Length
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
                >
                  <option value="Short">Short</option>
                  <option value="Medium">Medium</option>
                  <option value="Long">Long</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Call To Action
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Book a Demo"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Key Points
              </label>
              <input
                type="text"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Highlight 24/7 support and 14-day free trial"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] p-2.5 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateEmail}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs disabled:opacity-50 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating Email...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> ✨ Generate Email
                </>
              )}
            </button>

            {/* Error Message */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">AI Generation Warning:</span>
                  {aiError}
                </div>
              </div>
            )}

            {/* Generated Email Result Panel */}
            {generatedEmail && (
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-[#161B22] border border-violet-200 dark:border-violet-800 space-y-3">
                <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-[10px] font-semibold uppercase text-violet-600 dark:text-violet-400">
                    Generated Email Subject
                  </span>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                    {generatedEmail.subject}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase text-gray-500">Body Preview</span>
                  <div className="mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-[#0D1117] text-xs text-gray-700 dark:text-gray-300 max-h-36 overflow-y-auto font-mono">
                    {generatedEmail.bodyPlainText || generatedEmail.bodyHtml}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateEmail}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyGeneratedEmail}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                  >
                    <Check size={12} /> Use Email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Desktop / Mobile Email Preview with Variable Chips */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Email Live Preview
          </label>
          <div className="flex items-center bg-gray-100 dark:bg-[#0D1117] p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-white dark:bg-[#161B22] text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-white dark:bg-[#161B22] text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>
        </div>

        <div
          className={`mx-auto border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#161B22] p-4 shadow-sm transition-all ${
            previewMode === 'mobile' ? 'max-w-xs' : 'w-full'
          }`}
        >
          <div className="border-b border-gray-100 dark:border-gray-800 pb-2 mb-3 text-xs">
            <span className="text-gray-400 block text-[10px]">Subject</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {renderTextWithVariableChips(subject || 'Subject line...')}
            </span>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-300 min-h-[80px] leading-relaxed">
            {emailBody ? (
              renderTextWithVariableChips(emailBody)
            ) : (
              <span className="text-gray-400 italic">Body content preview will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Update Lead Step Configuration
 */
export function UpdateLeadConfig({ config = {}, onChange }) {
  const [status, setStatus] = useState(config.fields?.status || '')
  const [notes, setNotes] = useState(config.fields?.notes || '')
  const [priority, setPriority] = useState(config.fields?.priority || '')

  useEffect(() => {
    onChange({
      fields: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(priority && { priority }),
      },
    })
  }, [status, notes, priority, onChange])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Lead Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="">-- No change --</option>
          <option value="LEAD">Lead</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="">-- No change --</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes to the lead"
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  )
}

/**
 * Update Lead Score Step Configuration
 */
export function UpdateLeadScoreConfig({ config = {}, onChange }) {
  const [scoreChange, setScoreChange] = useState(config.scoreChange || 10)
  const [reason, setReason] = useState(config.reason || '')

  useEffect(() => {
    onChange({
      scoreChange: parseInt(scoreChange) || 0,
      reason,
    })
  }, [scoreChange, reason, onChange])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Score Change
        </label>
        <input
          type="number"
          value={scoreChange}
          onChange={(e) => setScoreChange(e.target.value)}
          placeholder="e.g., 10 or -5"
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Positive adds, negative subtracts</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reason
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Email opened"
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  )
}

/**
 * Wait Duration Step Configuration
 */
export function WaitDurationConfig({ config = {}, onChange }) {
  const [duration, setDuration] = useState(config.duration || 24)
  const [unit, setUnit] = useState(config.unit || 'HOURS')

  useEffect(() => {
    onChange({
      duration: parseInt(duration) || 1,
      unit,
    })
  }, [duration, unit, onChange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="SECONDS">Seconds</option>
            <option value="MINUTES">Minutes</option>
            <option value="HOURS">Hours</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
      </div>
    </div>
  )
}

/**
 * Condition Configuration (Email Opened, Lead Status, etc.)
 */
export function ConditionConfig({ config = {}, onChange, conditionType }) {
  const [operator, setOperator] = useState(config.operator || 'ANY')
  const [threshold, setThreshold] = useState(config.threshold || 50)

  useEffect(() => {
    const newConfig = { operator }
    if (conditionType?.includes('SCORE')) {
      newConfig.threshold = parseInt(threshold) || 0
    }
    onChange(newConfig)
  }, [operator, threshold, onChange, conditionType])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Operator
        </label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
        >
          <option value="ANY">Any</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {conditionType?.includes('SCORE') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Score Threshold
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            min="0"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#161B22] px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Get appropriate config form for step type
 */
export function getConfigForm(stepType) {
  switch (stepType) {
    case 'SEND_EMAIL':
      return SendEmailConfig
    case 'UPDATE_LEAD':
      return UpdateLeadConfig
    case 'UPDATE_LEAD_SCORE':
      return UpdateLeadScoreConfig
    case 'WAIT_DURATION':
      return WaitDurationConfig
    case 'EMAIL_OPENED_CONDITION':
    case 'EMAIL_CLICKED_CONDITION':
    case 'LEAD_STATUS_CONDITION':
    case 'LEAD_SCORE_CONDITION':
      return ConditionConfig
    default:
      return null
  }
}
