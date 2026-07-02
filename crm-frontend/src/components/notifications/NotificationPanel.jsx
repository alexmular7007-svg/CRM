import { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiBell, FiX, FiCheckCircle, FiMessageCircle, FiUsers, FiAward, FiCheckSquare, FiMessageSquare, FiTrash, FiClock, FiZap, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { closePanel, setNotifications, markAsRead, addNotification } from '../../store/slices/notificationSlice'
import api from '../../services/api'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import toast from 'react-hot-toast'

// Icon and color mapping for notification types
const notificationTypeConfig = {
  CHAT_MESSAGE: { icon: FiMessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  WORKSPACE_INVITATION: { icon: FiUsers, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  WORKSPACE_JOINED: { icon: FiUsers, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  ROLE_CHANGED: { icon: FiAward, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  TASK_ASSIGNED: { icon: FiCheckSquare, color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
  TASK_UPDATED: { icon: FiCheckSquare, color: 'text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
  TASK_COMMENT: { icon: FiMessageSquare, color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  TASK_MENTION: { icon: FiMessageSquare, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  TASK_DUE: { icon: FiClock, color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  TASK_OVERDUE: { icon: FiTrash, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  PROJECT_DUE: { icon: FiCalendar, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  CRM_UPDATED: { icon: FiTrendingUp, color: 'text-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-900/20' },
  CRM_ASSIGNED: { icon: FiTrendingUp, color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-900/20' },
  AI_INSIGHTS: { icon: FiZap, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  SYSTEM: { icon: FiBell, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/20' },
}

const NotificationPanel = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isOpen, notifications, unreadCount } = useSelector((state) => state.notifications)
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const [broadcastChannel, setBroadcastChannel] = useState(null)

  const { data } = useQuery({
    queryKey: ['notifications', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        console.warn('No workspace selected, notifications unavailable')
        return []
      }
      try {
        const response = await api.get('/notifications', {
          params: {
            workspaceId: currentWorkspace.id,
            page: 0,
            size: 50,
            unreadOnly: false
          }
        })
        console.debug('Notifications API response:', response.data)
        
        // API returns ApiResponse<Page<NotificationResponse>>
        // Structure: { success, message, data: { content: [...], totalElements, totalPages, ... } }
        const apiResponse = response.data
        if (apiResponse?.data?.content && Array.isArray(apiResponse.data.content)) {
          return apiResponse.data.content
        }
        if (apiResponse?.content && Array.isArray(apiResponse.content)) {
          return apiResponse.content
        }
        if (Array.isArray(apiResponse)) {
          return apiResponse
        }
        console.warn('Unexpected notification response format:', apiResponse)
        return []
      } catch (error) {
        console.error('Failed to fetch notifications:', error?.response?.data || error)
        toast.error('Failed to load notifications: ' + (error?.message || 'Unknown error'))
        return []
      }
    },
    enabled: isOpen && !!currentWorkspace?.id,
    retry: 1,
  })

  // Request browser notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Setup cross-tab synchronization using BroadcastChannel
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel('notifications')
    setBroadcastChannel(channel)

    const handleMessage = (event) => {
      if (event.data.type === 'notificationRead') {
        dispatch(markAsRead(event.data.notificationId))
      } else if (event.data.type === 'newNotification') {
        dispatch(addNotification(event.data.notification))
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [dispatch])

  useEffect(() => {
    if (data) {
      dispatch(setNotifications(data))
    }
  }, [data, dispatch])

  // Show browser notification for important types
  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const importantTypes = ['CHAT_MESSAGE', 'TASK_ASSIGNED', 'WORKSPACE_INVITATION', 'CRM_ASSIGNED', 'AI_INSIGHTS']
      if (importantTypes.includes(notification.type)) {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        })
      }
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await api.post(`/notifications/${notification.id}/read`, null, {
          params: {
            workspaceId: currentWorkspace.id
          }
        })
        dispatch(markAsRead(notification.id))
        
        // Broadcast to other tabs
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'notificationRead',
            notificationId: notification.id,
          })
        }
      }

      // Navigate using actionUrl if available
      if (notification.actionUrl) {
        navigate(notification.actionUrl)
      } else {
        // Fallback to old referenceType-based navigation
        switch (notification.referenceType) {
          case 'TASK':
            if (notification.projectId) {
              navigate(`/projects/${notification.projectId}/tasks`)
            }
            break
          case 'CHAT_ROOM':
            if (notification.referenceId) {
              navigate(`/chat/${notification.referenceId}`)
            }
            break
          case 'WORKSPACE':
            navigate('/workspaces')
            break
          case 'LEAD':
            if (notification.referenceId) {
              navigate(`/crm/leads/${notification.referenceId}`)
            }
            break
          case 'SYSTEM':
            navigate('/system/notifications')
            break
          default:
            break
        }
      }

      // Close panel
      dispatch(closePanel())
    } catch (error) {
      console.error('Error handling notification:', error)
      toast.error('Failed to process notification')
    }
  }

  // Group notifications by date
  const groupNotificationsByDate = (notifs) => {
    const groups = { today: [], yesterday: [], earlier: [] }
    
    notifs.forEach((notif) => {
      const date = new Date(notif.createdAt)
      if (isToday(date)) {
        groups.today.push(notif)
      } else if (isYesterday(date)) {
        groups.yesterday.push(notif)
      } else {
        groups.earlier.push(notif)
      }
    })
    
    return groups
  }

  const groupedNotifications = groupNotificationsByDate(notifications)

  const renderNotificationItem = (notification) => {
    const config = notificationTypeConfig[notification.type] || notificationTypeConfig.SYSTEM
    const IconComponent = config.icon

    return (
      <div
        key={notification.id}
        onClick={() => {
          handleNotificationClick(notification)
          showBrowserNotification(notification)
        }}
        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${
          !notification.isRead ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleNotificationClick(notification)
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 ${config.color}`}>
            <IconComponent className="text-lg" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{notification.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
          {!notification.isRead && (
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
          )}
        </div>
      </div>
    )
  }

  const renderNotificationGroup = (title, notifs) => {
    if (notifs.length === 0) return null

    return (
      <div key={title}>
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {notifs.map(renderNotificationItem)}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => dispatch(closePanel())} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FiBell className="text-xl" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch(closePanel())}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!currentWorkspace ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiBell className="text-4xl mb-2" />
              <p>Select a workspace to view notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiBell className="text-4xl mb-2" />
              <p>No notifications</p>
            </div>
          ) : (
            <div>
              {renderNotificationGroup('Today', groupedNotifications.today)}
              {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
              {renderNotificationGroup('Earlier', groupedNotifications.earlier)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel
