import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  MousePointerClick,
  Keyboard,
  Clock,
  Eye,
  AlignLeft,
  Link,
  Type,
  Camera,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import { chromeExtensionService } from '../../services/chromeExtensionService'

// ─── Templates for non-BROWSER types ──────────────────────────────────────────
const CONFIG_TEMPLATES = {
  API_CRUD: {
    config: {
      operation: 'POST',
      endpoint: '/api/leads',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test.lead@example.com',
        source: 'CHROME_EXTENSION',
      },
    },
    expected: {
      statusCode: 201,
      matchFields: { success: true, 'data.email': 'test.lead@example.com' },
    },
  },
  STORAGE_CRUD: {
    config: {
      operation: 'SET',
      storageArea: 'local',
      key: 'crm_active_lead',
      value: { leadId: 101, status: 'NEW', capturedAt: '2026-09-04T12:00:00Z' },
    },
    expected: { keyExists: true, nonEmpty: true },
  },
  DOM_INJECTION: {
    config: {
      targetSelector: 'div#crm-quick-action-widget',
      action: 'CLICK',
      waitForSelector: '.notification-toast',
      timeoutMs: 3000,
    },
    expected: { elementVisible: true, textContains: 'Lead captured' },
  },
  INTEGRATION: {
    config: {
      flow: 'END_TO_END_EXT_SYNC',
      steps: [
        { action: 'READ_STORAGE', key: 'auth_token' },
        { action: 'FETCH_API', endpoint: '/api/workspaces' },
        { action: 'WRITE_STORAGE', key: 'cached_workspaces' },
      ],
    },
    expected: { allStepsPassed: true, maxLatencyMs: 1500 },
  },
}

// ─── Browser action metadata ───────────────────────────────────────────────────
const BROWSER_ACTIONS = [
  { value: 'OPEN_PAGE',      label: 'Open Page',       icon: Globe },
  { value: 'CLICK',          label: 'Click',           icon: MousePointerClick },
  { value: 'TYPE',           label: 'Type',            icon: Keyboard },
  { value: 'WAIT',           label: 'Wait',            icon: Clock },
  { value: 'ASSERT_VISIBLE', label: 'Assert Visible',  icon: Eye },
  { value: 'ASSERT_TEXT',    label: 'Assert Text',     icon: AlignLeft },
  { value: 'ASSERT_URL',     label: 'Assert URL',      icon: Link },
  { value: 'ASSERT_TITLE',   label: 'Assert Title',    icon: Type },
  { value: 'SCREENSHOT',     label: 'Screenshot',      icon: Camera },
  { value: 'SELECT_OPTION',  label: 'Select Option',   icon: ChevronDown },
]

const OPEN_PAGE_NOTE = 'Use chrome-extension://<extension-id>/... for extension popup pages.'

const makeBlankStep = (order = 0) => ({
  _id: `step-${Date.now()}-${Math.random()}`,
  order,
  action: 'OPEN_PAGE',
  target: '',
  value: '',
  duration: '',
  filename: '',
})

function buildStepPayload(step) {
  const base = { order: step.order, action: step.action }
  switch (step.action) {
    case 'OPEN_PAGE':
    case 'CLICK':
    case 'ASSERT_VISIBLE':
      return { ...base, target: step.target.trim() }
    case 'TYPE':
    case 'ASSERT_TEXT':
    case 'SELECT_OPTION':
      return { ...base, target: step.target.trim(), value: step.value }
    case 'WAIT':
      return { ...base, duration: Number(step.duration) }
    case 'ASSERT_URL':
    case 'ASSERT_TITLE':
      return { ...base, value: step.value.trim() }
    case 'SCREENSHOT': {
      const payload = { ...base }
      const fn = (step.filename || '').trim()
      if (fn) payload.filename = fn
      return payload
    }
    default:
      return base
  }
}

// ─── Frontend validation (mirrors BrowserStepValidator) ───────────────────────
function validateBrowserSteps(steps) {
  if (!steps || steps.length === 0) return 'At least one browser step is required'
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    const n = i + 1
    switch (s.action) {
      case 'OPEN_PAGE':
        if (!s.target.trim()) return `Step ${n} (OPEN_PAGE): URL / target is required`
        if (s.target.toLowerCase().startsWith('file:')) return `Step ${n} (OPEN_PAGE): file:// URLs are not allowed`
        if (/^[a-zA-Z]:[/\\]/.test(s.target)) return `Step ${n} (OPEN_PAGE): Windows drive paths are not allowed`
        if (s.target.includes('..')) return `Step ${n} (OPEN_PAGE): Path traversal is not allowed`
        break
      case 'CLICK':
      case 'ASSERT_VISIBLE':
        if (!s.target.trim()) return `Step ${n} (${s.action}): CSS selector is required`
        break
      case 'TYPE':
      case 'SELECT_OPTION':
        if (!s.target.trim()) return `Step ${n} (${s.action}): CSS selector is required`
        if (s.value === '' || s.value == null) return `Step ${n} (${s.action}): Value is required`
        break
      case 'WAIT': {
        const dur = Number(s.duration)
        if (s.duration === '' || s.duration == null || isNaN(dur)) return `Step ${n} (WAIT): Duration must be a number`
        if (dur < 0) return `Step ${n} (WAIT): Duration cannot be negative`
        if (dur > 10000) return `Step ${n} (WAIT): Duration cannot exceed 10000 ms`
        break
      }
      case 'ASSERT_TEXT':
        if (!s.target.trim()) return `Step ${n} (ASSERT_TEXT): CSS selector is required`
        if (s.value === '' || s.value == null) return `Step ${n} (ASSERT_TEXT): Expected text is required`
        break
      case 'ASSERT_URL':
      case 'ASSERT_TITLE':
        if (!s.value.trim()) return `Step ${n} (${s.action}): Expected value is required`
        break
      case 'SCREENSHOT': {
        const fn = (s.filename || '').trim()
        if (fn) {
          if (fn.includes('..') || fn.includes('/') || fn.includes('\\')) {
            return `Step ${n} (SCREENSHOT): Filename cannot contain path separators or traversal sequences`
          }
          if (/^[a-zA-Z]:/.test(fn)) return `Step ${n} (SCREENSHOT): Filename cannot be a drive path`
        }
        break
      }
      default:
        break
    }
  }
  return null
}

// ─── FieldRow helper ──────────────────────────────────────────────────────────
function FieldRow({ label, value, onChange, placeholder, type = 'text', min, max }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}

// ─── BrowserStepCard ──────────────────────────────────────────────────────────
function BrowserStepCard({ step, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const actionMeta = BROWSER_ACTIONS.find((a) => a.value === step.action) || BROWSER_ACTIONS[0]
  const ActionIcon = actionMeta.icon

  const handleField = (field, val) => onChange({ ...step, [field]: val })

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#161B22] shadow-sm overflow-hidden">
      {/* Step header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/80 dark:bg-[#0D1117]/60 border-b border-gray-200 dark:border-[#30363D]">
        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
          #{index + 1}
        </span>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <ActionIcon size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
          <select
            value={step.action}
            onChange={(e) => handleField('action', e.target.value)}
            className="flex-1 min-w-0 text-xs font-medium border border-gray-200 dark:border-[#30363D] rounded-md px-2 py-1 bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {BROWSER_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors"
            title="Move up"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-[#21262D] transition-colors"
            title="Move down"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Remove step"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Action-specific fields */}
      <div className="p-3 space-y-2.5">
        {step.action === 'OPEN_PAGE' && (
          <>
            <FieldRow
              label="URL / Target"
              value={step.target}
              onChange={(v) => handleField('target', v)}
              placeholder="e.g. chrome-extension://<extension-id>/src/popup/popup.html"
            />
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={11} />{OPEN_PAGE_NOTE}
            </p>
          </>
        )}

        {(step.action === 'CLICK' || step.action === 'ASSERT_VISIBLE') && (
          <FieldRow
            label="CSS Selector"
            value={step.target}
            onChange={(v) => handleField('target', v)}
            placeholder="e.g. #ext-status-badge  or  button.submit"
          />
        )}

        {(step.action === 'TYPE' || step.action === 'SELECT_OPTION') && (
          <>
            <FieldRow
              label="CSS Selector"
              value={step.target}
              onChange={(v) => handleField('target', v)}
              placeholder={step.action === 'SELECT_OPTION' ? 'e.g. select#env' : 'e.g. input#search'}
            />
            <FieldRow
              label={step.action === 'SELECT_OPTION' ? 'Option value' : 'Text to type'}
              value={step.value}
              onChange={(v) => handleField('value', v)}
              placeholder={step.action === 'SELECT_OPTION' ? 'e.g. PROD' : 'e.g. user@example.com'}
            />
          </>
        )}

        {step.action === 'WAIT' && (
          <FieldRow
            label="Duration (ms) — 0 to 10000"
            value={step.duration}
            onChange={(v) => handleField('duration', v)}
            placeholder="e.g. 500"
            type="number"
            min={0}
            max={10000}
          />
        )}

        {step.action === 'ASSERT_TEXT' && (
          <>
            <FieldRow
              label="CSS Selector"
              value={step.target}
              onChange={(v) => handleField('target', v)}
              placeholder="e.g. #ext-status-badge"
            />
            <FieldRow
              label="Expected text (contained in element)"
              value={step.value}
              onChange={(v) => handleField('value', v)}
              placeholder="e.g. READY"
            />
          </>
        )}

        {(step.action === 'ASSERT_URL' || step.action === 'ASSERT_TITLE') && (
          <FieldRow
            label={step.action === 'ASSERT_URL' ? 'Expected URL substring' : 'Expected title substring'}
            value={step.value}
            onChange={(v) => handleField('value', v)}
            placeholder={step.action === 'ASSERT_URL' ? 'e.g. /dashboard' : 'e.g. Chrome Extension Playground'}
          />
        )}

        {step.action === 'SCREENSHOT' && (
          <FieldRow
            label="Filename (optional — alphanumeric, underscores, hyphens only)"
            value={step.filename}
            onChange={(v) => handleField('filename', v)}
            placeholder="e.g. popup_initial"
          />
        )}
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function TestCaseModal({
  isOpen,
  onClose,
  extensionId,
  testCase = null,
}) {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testType: 'API_CRUD',
    configStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.config, null, 2),
    expectedStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.expected, null, 2),
    enabled: true,
    displayOrder: 0,
  })

  const [browserSteps, setBrowserSteps] = useState([makeBlankStep(0)])

  useEffect(() => {
    if (testCase) {
      const tt = testCase.testType || 'API_CRUD'
      setFormData({
        name: testCase.name || '',
        description: testCase.description || '',
        testType: tt,
        configStr: testCase.configuration
          ? JSON.stringify(testCase.configuration, null, 2)
          : JSON.stringify(CONFIG_TEMPLATES[tt]?.config || {}, null, 2),
        expectedStr: testCase.expectedResult
          ? JSON.stringify(testCase.expectedResult, null, 2)
          : JSON.stringify(CONFIG_TEMPLATES[tt]?.expected || {}, null, 2),
        enabled: testCase.enabled !== false,
        displayOrder: testCase.displayOrder || 0,
      })

      if (tt === 'BROWSER' && testCase.configuration?.steps) {
        const loaded = testCase.configuration.steps.map((s, idx) => ({
          _id: `step-${Date.now()}-${idx}`,
          order: s.order ?? idx,
          action: s.action || 'OPEN_PAGE',
          target: s.target || '',
          value: s.value != null ? String(s.value) : '',
          duration: s.duration != null ? String(s.duration) : '',
          filename: s.filename || '',
        }))
        setBrowserSteps(loaded.length > 0 ? loaded : [makeBlankStep(0)])
      } else {
        setBrowserSteps([makeBlankStep(0)])
      }
    } else {
      setFormData({
        name: '',
        description: '',
        testType: 'API_CRUD',
        configStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.config, null, 2),
        expectedStr: JSON.stringify(CONFIG_TEMPLATES.API_CRUD.expected, null, 2),
        enabled: true,
        displayOrder: 0,
      })
      setBrowserSteps([makeBlankStep(0)])
    }
  }, [testCase, isOpen])

  const handleTypeChange = (newType) => {
    const template = CONFIG_TEMPLATES[newType]
    setFormData((prev) => ({
      ...prev,
      testType: newType,
      configStr: template ? JSON.stringify(template.config, null, 2) : prev.configStr,
      expectedStr: template ? JSON.stringify(template.expected, null, 2) : prev.expectedStr,
    }))
    if (newType === 'BROWSER' && browserSteps.length === 0) {
      setBrowserSteps([makeBlankStep(0)])
    }
  }

  const addStep = () => {
    setBrowserSteps((prev) => [...prev, makeBlankStep(prev.length)])
  }

  const removeStep = (idx) => {
    setBrowserSteps((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  const updateStep = (idx, updated) => {
    setBrowserSteps((prev) => prev.map((s, i) => (i === idx ? updated : s)))
  }

  const moveStep = (idx, dir) => {
    setBrowserSteps((prev) => {
      const next = [...prev]
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[swapIdx]
      next[swapIdx] = tmp
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  const createMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.createTestCase(currentWorkspace?.id, extensionId, payload),
    onSuccess: () => {
      toast.success('Test Case created successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', String(extensionId)] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', String(extensionId)] })
      onClose()
    },
    onError: (err) => toast.error(err?.message || 'Failed to create test case'),
  })

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.updateTestCase(currentWorkspace?.id, extensionId, testCase.id, payload),
    onSuccess: () => {
      toast.success('Test Case updated successfully')
      queryClient.invalidateQueries({ queryKey: ['extension-test-cases', String(extensionId)] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', String(extensionId)] })
      onClose()
    },
    onError: (err) => toast.error(err?.message || 'Failed to update test case'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Test case name is required')
      return
    }

    if (formData.testType === 'BROWSER') {
      const stepError = validateBrowserSteps(browserSteps)
      if (stepError) {
        toast.error(stepError)
        return
      }

      const steps = browserSteps.map((s, idx) => buildStepPayload({ ...s, order: idx }))
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        testType: 'BROWSER',
        configuration: { steps },
        expectedResult: { allStepsPassed: true },
        enabled: formData.enabled,
        displayOrder: Number(formData.displayOrder) || 0,
      }

      if (testCase) updateMutation.mutate(payload)
      else createMutation.mutate(payload)
      return
    }

    // Non-BROWSER path — unchanged
    let parsedConfig = null
    let parsedExpected = null

    if (formData.configStr.trim()) {
      try {
        parsedConfig = JSON.parse(formData.configStr)
      } catch (err) {
        toast.error('Invalid Configuration JSON: ' + err.message)
        return
      }
    }

    if (formData.expectedStr.trim()) {
      try {
        parsedExpected = JSON.parse(formData.expectedStr)
      } catch (err) {
        toast.error('Invalid Expected Result JSON: ' + err.message)
        return
      }
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      testType: formData.testType,
      configuration: parsedConfig,
      expectedResult: parsedExpected,
      enabled: formData.enabled,
      displayOrder: Number(formData.displayOrder) || 0,
    }

    if (testCase) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isBrowser = formData.testType === 'BROWSER'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={testCase ? 'Edit Test Case' : 'Create New Test Case'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name & Test Type row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Case Name *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. Popup smoke test"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Type
            </label>
            <select
              value={formData.testType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="API_CRUD">API CRUD</option>
              <option value="STORAGE_CRUD">Storage CRUD</option>
              <option value="DOM_INJECTION">DOM Injection</option>
              <option value="INTEGRATION">Integration</option>
              <option value="BROWSER">BROWSER</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="Describe what this test verifies..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* BROWSER steps editor */}
        {isBrowser && (
          <div className="space-y-3 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Browser Steps
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {browserSteps.length} step{browserSteps.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Steps execute sequentially via Playwright in the extension-runner.
                </p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                <Plus size={13} /> Add Step
              </button>
            </div>

            {browserSteps.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-center text-xs text-gray-500 dark:text-gray-400">
                No steps yet. Click <strong>Add Step</strong> to begin.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {browserSteps.map((step, idx) => (
                  <BrowserStepCard
                    key={step._id}
                    step={step}
                    index={idx}
                    total={browserSteps.length}
                    onChange={(updated) => updateStep(idx, updated)}
                    onRemove={() => removeStep(idx)}
                    onMoveUp={() => moveStep(idx, -1)}
                    onMoveDown={() => moveStep(idx, 1)}
                  />
                ))}
              </div>
            )}

            <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-indigo-200 dark:border-indigo-900/40">
              Use{' '}
              <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-[10px]">
                &lt;extension-id&gt;
              </code>{' '}
              in OPEN_PAGE URLs — the runner resolves it at execution time.
            </p>
          </div>
        )}

        {/* Non-BROWSER JSON editors */}
        {!isBrowser && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Configuration (JSON)
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Payload, endpoints, parameters</span>
              </div>
              <textarea
                rows={4}
                value={formData.configStr}
                onChange={(e) => setFormData({ ...formData, configStr: e.target.value })}
                className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-[#30363D] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expected Result / Assertions (JSON)
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">Expected status, match fields</span>
              </div>
              <textarea
                rows={3}
                value={formData.expectedStr}
                onChange={(e) => setFormData({ ...formData, expectedStr: e.target.value })}
                className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-[#30363D] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {/* Enabled toggle & order */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Enable Test Case for Test Runs
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Order:</span>
            <input
              type="number"
              min={0}
              max={999}
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-[#30363D] rounded bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white text-center"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#30363D]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
