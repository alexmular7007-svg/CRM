import api from './api'

const unwrap = (response) => response?.data ?? response

// Lead Management
export const createLead = async (leadData) => {
  const response = await api.post('/leads', leadData)
  return unwrap(response)
}

export const updateLead = async (leadId, leadData) => {
  const response = await api.put(`/leads/${leadId}`, leadData)
  return unwrap(response)
}

export const updateLeadStatus = async (leadId, statusData) => {
  const response = await api.patch(`/leads/${leadId}/status`, statusData)
  return unwrap(response)
}

export const getLeadById = async (leadId) => {
  const response = await api.get(`/leads/${leadId}`)
  return unwrap(response)
}

export const getLeadsByWorkspace = async (workspaceId, params = {}) => {
  const { page = 0, size = 50, sortBy = 'createdAt', sortDir = 'DESC' } = params
  const response = await api.get(`/leads/workspace/${workspaceId}`, {
    params: { page, size, sortBy, sortDir }
  })
  return unwrap(response)
}

export const filterLeads = async (workspaceId, filters = {}) => {
  const { status, assignedToId, priority, search, page = 0, size = 50, sortBy = 'createdAt', sortDir = 'DESC' } = filters
  const response = await api.get(`/leads/workspace/${workspaceId}/filter`, {
    params: { status, assignedToId, priority, search, page, size, sortBy, sortDir }
  })
  return unwrap(response)
}

export const deleteLead = async (leadId) => {
  const response = await api.delete(`/leads/${leadId}`)
  return unwrap(response)
}

export const getLeadActivities = async (leadId) => {
  const response = await api.get(`/leads/${leadId}/activities`)
  return unwrap(response)
}

export const getLeadAnalytics = async (workspaceId) => {
  const response = await api.get(`/leads/workspace/${workspaceId}/analytics`)
  return unwrap(response)
}

// Feature #1: Lead → Client → Project Conversion
export const convertLeadToProject = async (leadId, conversionRequest) => {
  const response = await api.post(`/leads/${leadId}/convert-to-project`, conversionRequest)
  return unwrap(response)
}
