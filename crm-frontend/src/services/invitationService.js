import api from './api'

const unwrap = (response) => response?.data ?? response

export const invitationService = {
  // Send invitation to new user
  sendInvitation: async (workspaceId, email, role) => {
    const response = await api.post(`/workspaces/${workspaceId}/invitations`, {
      email,
      role
    })
    return unwrap(response)
  },

  // Resend invitation to pending user
  resendInvitation: async (workspaceId, email) => {
    const response = await api.post(`/workspaces/${workspaceId}/invitations/resend`, {
      email
    })
    return unwrap(response)
  },

  // Revoke pending invitation
  revokeInvitation: async (workspaceId, email) => {
    const response = await api.delete(`/workspaces/${workspaceId}/invitations`, {
      data: { email }
    })
    return unwrap(response)
  },

  // Get pending invitations
  getPendingInvitations: async (workspaceId) => {
    const response = await api.get(`/workspaces/${workspaceId}/invitations/pending`)
    return unwrap(response)
  },

  // Accept invitation with token
  acceptInvitation: async (token) => {
    const response = await api.post(`/workspaces/invitations/accept/${token}`)
    return unwrap(response)
  },

  // Search users in workspace
  searchUsers: async (workspaceId, query) => {
    const response = await api.get(`/users/search`, {
      params: {
        workspaceId,
        q: query,
        page: 0,
        size: 20
      }
    })
    return unwrap(response)
  }
}
