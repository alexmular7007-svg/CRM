import api from './api'

const unwrap = (response) => response?.data ?? response

// Lead Magnet Management (Admin)
export const createLeadMagnet = async (workspaceId, magnetData) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/lead-magnets`,
    magnetData
  )
  return unwrap(response)
}

export const updateLeadMagnet = async (workspaceId, magnetId, magnetData) => {
  const response = await api.put(
    `/workspaces/${workspaceId}/lead-magnets/${magnetId}`,
    magnetData
  )
  return unwrap(response)
}

export const toggleLeadMagnetStatus = async (workspaceId, magnetId, statusData) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/lead-magnets/${magnetId}/status`,
    statusData
  )
  return unwrap(response)
}

export const getLeadMagnet = async (workspaceId, magnetId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/lead-magnets/${magnetId}`
  )
  return unwrap(response)
}

export const listLeadMagnets = async (workspaceId, params = {}) => {
  const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'DESC' } = params
  const response = await api.get(
    `/workspaces/${workspaceId}/lead-magnets`,
    {
      params: { page, size, sortBy, sortDir }
    }
  )
  return unwrap(response)
}

export const deleteLeadMagnet = async (workspaceId, magnetId) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/lead-magnets/${magnetId}`
  )
  return unwrap(response)
}

// Slug validation
export const validateSlug = async (workspaceId, slug, magnetId = null) => {
  const params = magnetId ? { magnetId } : {}
  const response = await api.get(
    `/workspaces/${workspaceId}/lead-magnets/validate-slug/${slug}`,
    { params }
  )
  return unwrap(response)
}

// Public (No Auth Required)
export const getPublicLeadMagnet = async (publicToken) => {
  const response = await api.get(
    `/public/lead-magnets/${publicToken}`
  )
  return unwrap(response)
}

export const submitPublicForm = async (publicToken, formData) => {
  const response = await api.post(
    `/public/lead-magnets/${publicToken}/submit`,
    formData
  )
  return unwrap(response)
}
