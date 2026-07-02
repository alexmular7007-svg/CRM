import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { store } from '../store'
import { addNotification } from '../store/slices/notificationSlice'
import { setConnected } from '../store/slices/chatSlice'
import { setUserOnline, setUserOffline, setOnlineUsers } from '../store/slices/presenceSlice'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.connecting = false
    this.subscriptions = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.manualDisconnect = false
    this.heartbeatInterval = null
  }

  connect() {
    const token = store.getState().auth.token
    if (!token) return

    if (this.client && !this.manualDisconnect) return

    if (this.client) {
      try { this.client.deactivate() } catch (e) {}
    }

    this.connecting = true
    this.manualDisconnect = false

    console.log('Initializing websocket connection...')

    this.client = new Client({
      webSocketFactory: () => {
        // ⚠️ SockJS expects HTTP URLs, not WS URLs
        // It handles protocol conversion internally
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
        const sockJsUrl = `${baseUrl}/ws`
        console.log('SockJS URL:', sockJsUrl)
        return new SockJS(sockJsUrl)
      },

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      debug: (str) => {
        if (import.meta.env.DEV) console.log('STOMP:', str)
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('WebSocket connected successfully')
        this.connected = true
        this.connecting = false
        this.reconnectAttempts = 0
        store.dispatch(setConnected(true))

        this.subscribeToNotifications()
        this.subscribeToPresence()
        this.subscribeToPresenceSnapshot()
        this.notifyConnection()
        this.startHeartbeat()
      },

      onDisconnect: () => {
        console.log('WebSocket disconnected')
        this.connected = false
        if (this.manualDisconnect) this.connecting = false
        this.stopHeartbeat()
        this.cleanupSubscriptions()
        store.dispatch(setConnected(false))
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        this.connected = false
        if (this.manualDisconnect) this.connecting = false
        this.stopHeartbeat()
        store.dispatch(setConnected(false))
      },

      onWebSocketError: (error) => {
        console.error('WebSocket error:', error)
        this.connected = false
        if (this.manualDisconnect) this.connecting = false
        this.stopHeartbeat()
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Maximum websocket reconnect attempts reached')
          this.manualDisconnect = true
          if (this.client) this.client.deactivate()
          store.dispatch(setConnected(false))
        }
      },

      onWebSocketClose: () => {
        console.warn('WebSocket connection closed')
        this.connected = false
        if (this.manualDisconnect) this.connecting = false
        this.stopHeartbeat()
        store.dispatch(setConnected(false))
      },
    })

    this.client.activate()
  }

  disconnect() {
    console.log('Disconnecting websocket manually')
    this.manualDisconnect = true
    this.stopHeartbeat()
    this.cleanupSubscriptions()
    if (this.client && this.client.active) this.client.deactivate()
    this.connected = false
    this.connecting = false
    store.dispatch(setConnected(false))
  }

  cleanupSubscriptions() {
    this.subscriptions.forEach((subscription) => {
      try { subscription.unsubscribe() } catch (error) {
        console.error('Subscription cleanup failed:', error)
      }
    })
    this.subscriptions.clear()
  }

  // ─── Heartbeat — keeps Redis presence TTL alive ───────────────────────────

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.client) {
        try {
          this.client.publish({ destination: '/app/chat/heartbeat', body: '{}' })
        } catch (e) {
          console.warn('Heartbeat failed:', e)
        }
      }
    }, 30000) // every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // ─── Notify backend of manual connect (legacy) ───────────────────────────

  notifyConnection() {
    if (!this.connected || !this.client) return
    try {
      this.client.publish({ destination: '/app/chat/connect', body: '{}' })
    } catch (error) {
      console.error('Failed to notify websocket connection:', error)
    }
  }

  // ─── Presence: individual user online/offline events ─────────────────────

  subscribeToPresence() {
    if (!this.client || !this.connected) return
    if (this.subscriptions.has('presence')) return

    try {
      const subscription = this.client.subscribe('/topic/presence', (message) => {
        try {
          const data = JSON.parse(message.body)
          // New shape: { userId, userName, isOnline, lastSeen }
          if (data.isOnline) {
            store.dispatch(setUserOnline({ userId: data.userId, userName: data.userName, lastSeen: data.lastSeen }))
          } else {
            store.dispatch(setUserOffline({ userId: data.userId, lastSeen: data.lastSeen }))
          }
        } catch (error) {
          console.error('Failed to parse presence message:', error)
        }
      })
      this.subscriptions.set('presence', subscription)
      console.log('Subscribed to presence updates')
    } catch (error) {
      console.error('Failed to subscribe to presence:', error)
    }
  }

  // ─── Presence snapshot: full list of online users sent on each connect ───

  subscribeToPresenceSnapshot() {
    if (!this.client || !this.connected) return
    if (this.subscriptions.has('presence-snapshot')) return

    try {
      const subscription = this.client.subscribe('/topic/presence/snapshot', (message) => {
        try {
          const data = JSON.parse(message.body)
          // data.onlineUserIds = [1, 2, 5, ...]
          if (Array.isArray(data.onlineUserIds)) {
            store.dispatch(setOnlineUsers(data.onlineUserIds))
          }
        } catch (error) {
          console.error('Failed to parse presence snapshot:', error)
        }
      })
      this.subscriptions.set('presence-snapshot', subscription)
      console.log('Subscribed to presence snapshot')
    } catch (error) {
      console.error('Failed to subscribe to presence snapshot:', error)
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  subscribeToNotifications() {
    const user = store.getState().auth.user
    if (!user || !this.client || !this.connected) return
    if (this.subscriptions.has('notifications')) return

    // Setup cross-tab sync channel
    let broadcastChannel = null
    if ('BroadcastChannel' in window) {
      broadcastChannel = new BroadcastChannel('notifications')
    }

    try {
      const subscription = this.client.subscribe('/user/queue/notifications', (message) => {
        try {
          const notification = JSON.parse(message.body)
          store.dispatch(addNotification(notification))

          // Show browser notification for important types
          if ('Notification' in window && Notification.permission === 'granted') {
            const importantTypes = ['CHAT_MESSAGE', 'TASK_ASSIGNED', 'WORKSPACE_INVITATION', 'CRM_ASSIGNED', 'AI_INSIGHTS']
            if (importantTypes.includes(notification.type)) {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
              })
            }
          }

          // Broadcast to other tabs
          if (broadcastChannel) {
            broadcastChannel.postMessage({
              type: 'newNotification',
              notification: notification,
            })
          }
        } catch (error) {
          console.error('Failed to parse notification message:', error)
        }
      })
      this.subscriptions.set('notifications', subscription)
      console.log('Subscribed to notifications')
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error)
    }
  }

  // ─── Chat room ────────────────────────────────────────────────────────────

  subscribeToChat(roomId, callback) {
    if (!this.client || !this.connected) return null
    const key = `chat-${roomId}`
    if (this.subscriptions.has(key)) return this.subscriptions.get(key)

    try {
      const subscription = this.client.subscribe(`/topic/chat/${roomId}`, (message) => {
        try {
          const chatMessage = JSON.parse(message.body)
          callback(chatMessage)
        } catch (error) {
          console.error('Failed to parse chat message:', error)
        }
      })
      this.subscriptions.set(key, subscription)
      console.log(`Subscribed to chat room ${roomId}`)
      return subscription
    } catch (error) {
      console.error(`Failed to subscribe to chat room ${roomId}:`, error)
      return null
    }
  }

  unsubscribeFromChat(roomId) {
    const key = `chat-${roomId}`
    const subscription = this.subscriptions.get(key)
    if (!subscription) return
    try {
      subscription.unsubscribe()
      this.subscriptions.delete(key)
      console.log(`Unsubscribed from chat room ${roomId}`)
    } catch (error) {
      console.error(`Failed to unsubscribe from chat room ${roomId}:`, error)
    }
  }

  subscribeToTyping(roomId, callback) {
    if (!this.client || !this.connected) return null
    const key = `typing-${roomId}`
    if (this.subscriptions.has(key)) return this.subscriptions.get(key)

    try {
      const subscription = this.client.subscribe(`/topic/chat/${roomId}/typing`, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (error) {
          console.error('Failed to parse typing indicator:', error)
        }
      })
      this.subscriptions.set(key, subscription)
      return subscription
    } catch (error) {
      console.error(`Failed to subscribe to typing for room ${roomId}:`, error)
      return null
    }
  }

  unsubscribeFromTyping(roomId) {
    const key = `typing-${roomId}`
    const subscription = this.subscriptions.get(key)
    if (!subscription) return
    try {
      subscription.unsubscribe()
      this.subscriptions.delete(key)
    } catch (error) {
      console.error(`Failed to unsubscribe from typing for room ${roomId}:`, error)
    }
  }

  sendChatMessage(roomId, message) {
    if (!this.client || !this.connected) {
      console.warn('Cannot send message: websocket not connected')
      return
    }
    try {
      this.client.publish({ destination: `/app/chat/${roomId}`, body: JSON.stringify(message) })
    } catch (error) {
      console.error('Failed to send chat message:', error)
    }
  }

  sendTypingIndicator(roomId, isTyping) {
    if (!this.client || !this.connected) return
    try {
      this.client.publish({
        destination: '/app/chat/typing',
        body: JSON.stringify({ chatRoomId: roomId, isTyping }),
      })
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }
}

export const websocketService = new WebSocketService()
