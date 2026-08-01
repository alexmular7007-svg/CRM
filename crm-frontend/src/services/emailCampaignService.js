import api from './api'

const unwrap = (response) => response?.data ?? response
const campaignPath = (workspaceId, campaignId = '') =>
  `/workspaces/${workspaceId}/email-campaigns${campaignId ? `/${campaignId}` : ''}`

export const emailCampaignService = {
  async listCampaigns(workspaceId, { page = 0, size = 20, sortBy = 'createdAt', status } = {}) {
    const path = status ? `${campaignPath(workspaceId)}/status/${status}` : campaignPath(workspaceId)
    return unwrap(await api.get(path, { params: { page, size, sortBy } }))
  },
  async getCampaign(workspaceId, campaignId) {
    return unwrap(await api.get(campaignPath(workspaceId, campaignId)))
  },
  async createCampaign(workspaceId, payload) {
    return unwrap(await api.post(campaignPath(workspaceId), payload))
  },
  async updateCampaign(workspaceId, campaignId, payload) {
    return unwrap(await api.put(campaignPath(workspaceId, campaignId), payload))
  },
  async deleteCampaign(workspaceId, campaignId) {
    return unwrap(await api.delete(campaignPath(workspaceId, campaignId)))
  },
  async sendCampaign(workspaceId, campaignId) {
    return unwrap(await api.post(`${campaignPath(workspaceId, campaignId)}/send`))
  },
  async scheduleCampaign(workspaceId, campaignId, payload) {
    return unwrap(await api.post(`${campaignPath(workspaceId, campaignId)}/schedule`, payload))
  },
  async listRecipients(workspaceId, campaignId, { page = 0, size = 50, sortBy = 'createdAt' } = {}) {
    return unwrap(await api.get(`${campaignPath(workspaceId, campaignId)}/recipients`, { params: { page, size, sortBy } }))
  },
  async addRecipients(workspaceId, campaignId, payload) {
    return unwrap(await api.post(`${campaignPath(workspaceId, campaignId)}/recipients`, payload))
  },
  async removeRecipient(workspaceId, campaignId, recipientId) {
    return unwrap(await api.delete(`${campaignPath(workspaceId, campaignId)}/recipients/${recipientId}`))
  },
  async listTemplates(workspaceId, { page = 0, size = 100, sortBy = 'createdAt' } = {}) {
    return unwrap(await api.get(`/workspaces/${workspaceId}/email-templates`, { params: { page, size, sortBy } }))
  },
  async listSegments(workspaceId, { page = 0, size = 100, sortBy = 'createdAt' } = {}) {
    return unwrap(await api.get(`/workspaces/${workspaceId}/email-segments`, { params: { page, size, sortBy } }))
  },
  async createTemplate(workspaceId, payload) {
    return unwrap(await api.post(`/workspaces/${workspaceId}/email-templates`, payload))
  },
}
