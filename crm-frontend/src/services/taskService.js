import api from './api'

const unwrap = (response) => response?.data ?? response

export const taskService = {
  getAll: async (params) => {
    const response = await api.get('/tasks', { params })
    return unwrap(response)
  },

  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`)
    return unwrap(response)
  },

  getByProject: async (projectId, params) => {
    const response = await api.get(`/tasks/project/${projectId}`, { params })
    return unwrap(response)
  },

  create: async (taskData) => {
    const response = await api.post('/tasks', taskData)
    return unwrap(response)
  },

  update: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData)
    return unwrap(response)
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status })
    return unwrap(response)
  },

  delete: async (id, workspaceId) => {
    const response = await api.delete(`/tasks/${id}`, { params: { workspaceId } })
    return unwrap(response)
  },

  // Comments
  getComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`)
    return unwrap(response)
  },

  addComment: async (taskId, commentData) => {
    const response = await api.post(`/tasks/${taskId}/comments`, commentData)
    return unwrap(response)
  },

  // Activities
  getActivities: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/activities`)
    return unwrap(response)
  },

  // Attachments
  uploadAttachment: async (taskId, formData) => {
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrap(response)
  },

  // Watchers
  addWatcher: async (taskId, userId) => {
    const response = await api.post(`/tasks/${taskId}/watchers`, { userId })
    return unwrap(response)
  },

  removeWatcher: async (taskId, userId) => {
    const response = await api.delete(`/tasks/${taskId}/watchers/${userId}`)
    return unwrap(response)
  },
}
