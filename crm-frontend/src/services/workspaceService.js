import api from './api'

const unwrap = (response) => response?.data ?? response

export const workspaceService = {
  getAll: async () => {
    const response = await api.get('/workspaces')
    return unwrap(response)
  },

  getById: async (id) => {
    const response = await api.get(`/workspaces/${id}`)
    return unwrap(response)
  },

  create: async (workspaceData) => {
    const response = await api.post('/workspaces', workspaceData)
    return unwrap(response)
  },

  update: async (id, workspaceData) => {
    const response = await api.put(`/workspaces/${id}`, workspaceData)
    return unwrap(response)
  },

  delete: async (id) => {
    const response = await api.delete(`/workspaces/${id}`)
    return unwrap(response)
  },

  getMembers: async (id) => {
    const response = await api.get(`/workspaces/${id}/members`, { params: { page: 0, size: 100 } })
    return unwrap(response)
  },

  addMember: async (id, memberData) => {
    const response = await api.post(`/workspaces/${id}/members`, memberData)
    return unwrap(response)
  },

  removeMember: async (workspaceId, memberId) => {
    const response = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`)
    return unwrap(response)
  },

  getMyRole: async (id) => {
    const response = await api.get(`/workspaces/${id}/members/role`)
    return unwrap(response)
  },
}
