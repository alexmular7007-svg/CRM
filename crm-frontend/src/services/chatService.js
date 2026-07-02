import api from './api'

const unwrap = (response) => response?.data ?? response

export const chatService = {
  // Chat Rooms
  getRooms: async () => {
    const response = await api.get('/chat/rooms', { params: { page: 0, size: 100 } })
    return unwrap(response)
  },

  getRoom: async (roomId) => {
    const response = await api.get(`/chat/rooms/${roomId}`)
    return unwrap(response)
  },

  createRoom: async (roomData) => {
    const response = await api.post('/chat/rooms', roomData)
    return unwrap(response)
  },

  getOrCreatePrivateChat: async (userId, workspaceId) => {
    const response = await api.post(`/chat/rooms/private/${userId}`, null, { 
      params: { workspaceId } 
    })
    return unwrap(response)
  },

  addParticipant: async (roomId, userId) => {
    const response = await api.post(`/chat/rooms/${roomId}/participants/${userId}`)
    return unwrap(response)
  },

  removeParticipant: async (roomId, userId) => {
    const response = await api.delete(`/chat/rooms/${roomId}/participants/${userId}`)
    return unwrap(response)
  },

  // Messages
  getMessages: async (roomId, params) => {
    const response = await api.get(`/chat/messages/rooms/${roomId}`, { params })
    return unwrap(response)
  },

  sendMessage: async (messageData) => {
    const response = await api.post('/chat/messages', messageData)
    return unwrap(response)
  },

  updateMessage: async (messageId, content) => {
    const response = await api.put(`/chat/messages/${messageId}`, { content })
    return unwrap(response)
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`)
    return unwrap(response)
  },

  markAsRead: async (roomId) => {
    const response = await api.put(`/chat/rooms/${roomId}/read`)
    return unwrap(response)
  },

  getUnreadCount: async (roomId) => {
    const response = await api.get(`/chat/rooms/${roomId}/unread-count`)
    return unwrap(response)
  },

  // Delete entire chat room (creator only)
  deleteRoom: async (roomId) => {
    const response = await api.delete(`/chat/rooms/${roomId}`)
    return unwrap(response)
  },

  // Block a user
  blockUser: async (userId) => {
    const response = await api.post(`/chat/rooms/block/${userId}`)
    return unwrap(response)
  },

  // Unblock a user
  unblockUser: async (userId) => {
    const response = await api.delete(`/chat/rooms/block/${userId}`)
    return unwrap(response)
  },

  // Get blocked user IDs
  getBlockedUsers: async () => {
    const response = await api.get('/chat/rooms/blocked')
    return unwrap(response)
  },
}
