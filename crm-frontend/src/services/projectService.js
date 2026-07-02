import api from './api'

const unwrap = (response) => response?.data ?? response

export const projectService = {
  // Get all projects for a workspace
  getAll: async (workspaceId) => {
    const response = await api.get(`/projects/workspace/${workspaceId}`)
    return unwrap(response)
  },

  // Get project by ID
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`)
    return unwrap(response)
  },

  // Create new project — POST /api/projects with workspaceId in body
  create: async (workspaceId, projectData) => {
    const response = await api.post('/projects', { ...projectData, workspaceId: Number(workspaceId) })
    return unwrap(response)
  },

  // Update project
  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData)
    return unwrap(response)
  },

  // Delete project
  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`)
    return unwrap(response)
  },

  // Get project members
  getMembers: async (id) => {
    const response = await api.get(`/projects/${id}/members`)
    return unwrap(response)
  },

  // Add member to project
  addMember: async (id, memberData) => {
    const response = await api.post(`/projects/${id}/members`, memberData)
    return unwrap(response)
  },

  // Remove member from project
  removeMember: async (projectId, memberId) => {
    const response = await api.delete(`/projects/${projectId}/members/${memberId}`)
    return unwrap(response)
  },

  // Get project activity
  getActivity: async (id) => {
    const response = await api.get(`/projects/${id}/activity`)
    return unwrap(response)
  },

  // Archive project
  archive: async (id) => {
    const response = await api.put(`/projects/${id}/archive`)
    return unwrap(response)
  },

  // Unarchive project
  unarchive: async (id) => {
    const response = await api.put(`/projects/${id}/unarchive`)
    return unwrap(response)
  },
}
