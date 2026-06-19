import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiBell, FiX } from 'react-icons/fi'
import { closePanel, setNotifications } from '../../store/slices/notificationSlice'
import api from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const NotificationPanel = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isOpen, notifications, unreadCount } = useSelector((state) => state.notifications)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      // API returns { success, data: [...] } — extract the array
      const payload = response.data
      if (Array.isArray(payload)) return payload
      if (payload?.data && Array.isArray(payload.data)) return payload.data
      if (payload?.content && Array.isArray(payload.content)) return payload.content
      return []
    },
    enabled: isOpen,
  })

  useEffect(() => {
    if (data) {
      dispatch(setNotifications(data))
    }
  }, [data, dispatch])

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await api.post(`/notifications/${notification.id}/read`)
      }

      // Navigate based on type
      switch (notification.referenceType) {
        case 'TASK':
        case 'TASK_ASSIGNED':
          if (notification.projectId) {
            navigate(`/projects/${notification.projectId}/tasks`)
          }
          break
        case 'CHAT':
        case 'MESSAGE':
          if (notification.chatRoomId) {
            navigate(`/chat/${notification.chatRoomId}`)
          }
          break
        case 'WORKSPACE':
          navigate('/workspaces')
          break
        case 'WORKSPACE_MEMBER':
        case 'WORKSPACE_INVITATION':
          navigate('/workspaces')
          break
        case 'COMMENT':
          if (notification.projectId) {
            navigate(`/projects/${notification.projectId}/tasks`)
          }
          break
        default:
          console.warn('Unknown notification type:', notification.referenceType)
      }

      // Close panel
      dispatch(closePanel())
    } catch (error) {
      console.error('Error handling notification:', error)
      toast.error('Failed to process notification')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => dispatch(closePanel())} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
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

        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiBell className="text-4xl mb-2" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel
