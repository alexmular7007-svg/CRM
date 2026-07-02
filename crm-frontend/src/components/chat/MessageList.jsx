import { useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chatService'
import toast from 'react-hot-toast'

const MessageList = ({ messages, roomDetails }) => {
  const currentUser = useSelector((state) => state.auth.user)
  const queryClient = useQueryClient()
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showMenuId, setShowMenuId] = useState(null)

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId) => chatService.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries(['chatMessages'])
      toast.success('Message deleted')
      setShowMenuId(null)
    },
    onError: () => {
      toast.error('Failed to delete message')
    },
  })

  // Update message mutation
  const updateMutation = useMutation({
    mutationFn: ({ messageId, content }) =>
      chatService.updateMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatMessages'])
      toast.success('Message updated')
      setEditingMessageId(null)
      setEditContent('')
    },
    onError: () => {
      toast.error('Failed to update message')
    },
  })

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`
    return format(date, 'MMM d, h:mm a')
  }

  const formatDateDivider = (timestamp) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  const shouldShowDateDivider = (currentMsg, prevMsg) => {
    if (!prevMsg) return true
    return !isSameDay(new Date(currentMsg.createdAt), new Date(prevMsg.createdAt))
  }

  const handleStartEdit = (message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
    setShowMenuId(null)
  }

  const handleSaveEdit = (messageId) => {
    if (!editContent.trim()) return
    updateMutation.mutate({ messageId, content: editContent })
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleDelete = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMutation.mutate(messageId)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-700 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUser?.id
        const showDateDivider = shouldShowDateDivider(message, messages[index - 1])

        return (
          <div key={message.id}>
            {/* Date Divider */}
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                  {formatDateDivider(message.createdAt)}
                </div>
              </div>
            )}

            {/* Message */}
            <div
              className={clsx(
                'flex gap-3 group',
                isOwnMessage && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              {!isOwnMessage && (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {message.senderName?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Message Content */}
              <div className={clsx('flex-1 max-w-2xl', isOwnMessage && 'flex justify-end')}>
                <div>
                  {/* Sender Name & Time */}
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="relative">
                    {editingMessageId === message.id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="btn-primary text-sm"
                            disabled={updateMutation.isPending}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-outline text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div
                        className={clsx(
                          'px-4 py-2 rounded-lg',
                          isOwnMessage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.isEdited && (
                          <span className="text-xs opacity-70 mt-1 block">
                            (edited)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Actions */}
                    {isOwnMessage && editingMessageId !== message.id && (
                      <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={() => setShowMenuId(showMenuId === message.id ? null : message.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <FiMoreVertical className="text-gray-500" />
                          </button>
                          {showMenuId === message.id && (
                            <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              <button
                                onClick={() => handleStartEdit(message)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <FiEdit2 className="text-sm" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(message.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                              >
                                <FiTrash2 className="text-sm" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time for own messages */}
                  {isOwnMessage && (
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList
