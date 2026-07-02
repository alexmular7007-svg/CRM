import api from './api'

const unwrap = (response) => response?.data ?? response

export const aiService = {
  // Task AI
  prioritizeTask: async (taskData) => {
    const response = await api.post('/ai/tasks/prioritize', taskData)
    return unwrap(response)
  },

  predictDeadline: async (taskData) => {
    const response = await api.post('/ai/tasks/deadline-predict', taskData)
    return unwrap(response)
  },

  // Chat AI
  summarizeChat: async (chatData) => {
    const response = await api.post('/ai/chat/summarize', chatData)
    return unwrap(response)
  },

  getSmartReplies: async (messageData) => {
    const response = await api.post('/ai/chat/reply-suggestions', messageData)
    return unwrap(response)
  },

  // Insights
  getProductivityInsights: async () => {
    const response = await api.get('/ai/insights/productivity')
    return unwrap(response)
  },

  getWorkspaceInsights: async (workspaceId, forceRefresh = false) => {
    const response = await api.get(`/ai/insights/dashboard/${workspaceId}`, {
      params: { refresh: forceRefresh }
    })
    return unwrap(response)
  },
}
