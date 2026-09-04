import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import { chromeExtensionService } from '../../services/chromeExtensionService'

const DEFAULT_MANIFEST = {
  manifest_version: 3,
  name: 'My CRM Extension',
  version: '1.0.0',
  description: 'CRM integration extension',
  permissions: ['storage', 'activeTab'],
  action: {
    default_popup: 'popup.html',
    default_icon: 'icon.png'
  }
}

export default function ExtensionModal({ isOpen, onClose, extension = null }) {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [formData, setFormData] = useState({
    name: '',
    version: '1.0.0',
    description: '',
    status: 'ACTIVE',
    manifestJsonStr: JSON.stringify(DEFAULT_MANIFEST, null, 2),
  })

  useEffect(() => {
    if (extension) {
      setFormData({
        name: extension.name || '',
        version: extension.version || '1.0.0',
        description: extension.description || '',
        status: extension.status || 'ACTIVE',
        manifestJsonStr: extension.manifestJson
          ? JSON.stringify(extension.manifestJson, null, 2)
          : JSON.stringify(DEFAULT_MANIFEST, null, 2),
      })
    } else {
      setFormData({
        name: '',
        version: '1.0.0',
        description: '',
        status: 'ACTIVE',
        manifestJsonStr: JSON.stringify(DEFAULT_MANIFEST, null, 2),
      })
    }
  }, [extension, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload) => chromeExtensionService.createExtension(currentWorkspace?.id, payload),
    onSuccess: () => {
      toast.success('Chrome Extension registered successfully')
      queryClient.invalidateQueries({ queryKey: ['chrome-extensions'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to register extension')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      chromeExtensionService.updateExtension(currentWorkspace?.id, extension.id, payload),
    onSuccess: () => {
      toast.success('Chrome Extension updated successfully')
      queryClient.invalidateQueries({ queryKey: ['chrome-extensions'] })
      queryClient.invalidateQueries({ queryKey: ['chrome-extension', String(extension?.id)] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update extension')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Extension name is required')
      return
    }

    let parsedManifest = null
    if (formData.manifestJsonStr.trim()) {
      try {
        parsedManifest = JSON.parse(formData.manifestJsonStr)
      } catch (err) {
        toast.error('Invalid Manifest JSON format: ' + err.message)
        return
      }
    }

    const payload = {
      name: formData.name.trim(),
      version: formData.version.trim() || '1.0.0',
      description: formData.description.trim(),
      status: formData.status,
      manifestJson: parsedManifest,
    }

    if (extension) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={extension ? 'Edit Chrome Extension' : 'Register New Chrome Extension'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Version */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Extension Name *
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="e.g. CRM Pipeline Lead Hunter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Version
            </label>
            <input
              type="text"
              maxLength={50}
              placeholder="1.0.0"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Brief explanation of the extension's purpose and functionality..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Manifest JSON */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Manifest JSON (Manifest V3)
            </label>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  manifestJsonStr: JSON.stringify(DEFAULT_MANIFEST, null, 2),
                })
              }
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Reset to V3 Template
            </button>
          </div>
          <textarea
            rows={6}
            value={formData.manifestJsonStr}
            onChange={(e) => setFormData({ ...formData, manifestJsonStr: e.target.value })}
            className="w-full px-3 py-2 font-mono text-xs border border-gray-300 dark:border-[#30363D] rounded-lg bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Buttons */}
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
            {extension ? 'Save Changes' : 'Register Extension'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
