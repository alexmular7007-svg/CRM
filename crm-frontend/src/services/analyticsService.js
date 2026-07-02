import api from './api'

const unwrap = (response) => response?.data ?? response

export const analyticsService = {
  getDashboard: async (workspaceId) => {
    const response = await api.get('/dashboard/overview', {
      params: { workspaceId }
    })
    return unwrap(response)
  },

  getTaskAnalytics: async (params) => {
    const response = await api.get('/analytics/tasks', { 
      params: { workspaceId: params.workspaceId, startDate: params.startDate, endDate: params.endDate } 
    })
    return unwrap(response)
  },

  getTeamPerformance: async (params) => {
    const response = await api.get('/analytics/team', { 
      params: { workspaceId: params.workspaceId, startDate: params.startDate, endDate: params.endDate } 
    })
    return unwrap(response)
  },

  getActivityAnalytics: async (params) => {
    const response = await api.get('/analytics/activity', { 
      params: { workspaceId: params.workspaceId, startDate: params.startDate, endDate: params.endDate } 
    })
    return unwrap(response)
  },

  getRecentActivities: async (workspaceId, limit = 10) => {
    const response = await api.get('/analytics/recent', { 
      params: { workspaceId, limit },
      silent: true 
    })
    return unwrap(response)
  },

  getDailyReport: async (date) => {
    const response = await api.get('/reports/daily', { params: { date } })
    return unwrap(response)
  },

  getWeeklyReport: async (startDate) => {
    const response = await api.get('/reports/weekly', { params: { startDate } })
    return unwrap(response)
  },

  getMonthlyReport: async (year, month) => {
    const response = await api.get('/reports/monthly', { params: { year, month } })
    return unwrap(response)
  },
}
