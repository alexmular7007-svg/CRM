import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chatService'
import clsx from 'clsx'
import { format, isToday, isYesterday } from 'date-fns'
import {
  FiSearch,
  FiPlus,
  FiHash,
  FiLock,
  FiUsers,
  FiMessageSquare,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import CreateRoomModal from './CreateRoomModal'

const ChatSidebar = ({ rooms, selectedRoom, onSelectRoom }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace)
  const workspaceId = currentWorkspace?.id

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d')
  }

  const getRoomIcon = (type) => {
    switch (type) {
      case 'PRIVATE':
        return <FiLock className="text-gray-500" />
      case 'GROUP':
        return <FiUsers className="text-blue-500" />
      case 'PROJECT':
        return <FiHash className="text-green-500" />
      case 'TASK':
        return <FiMessageSquare className="text-purple-500" />
      case 'WORKSPACE':
        return <FiHash className="text-orange-500" />
      default:
        return <FiHash className="text-gray-500" />
    }
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="New conversation"
          >
            <FiPlus className="text-xl" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={clsx(
                  'w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                  selectedRoom?.id === room.id &&
                    'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Room Icon */}
                  <div className="mt-1">{getRoomIcon(room.type)}</div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{room.name}</h3>
                      {room.lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatLastMessageTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Last Message */}
                    {room.lastMessage ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {room.lastMessage.senderName}:{' '}
                        {room.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No messages yet
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {room.unreadCount > 0 && (
                    <div className="flex-shrink-0 mt-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                        {room.unreadCount > 9 ? '9+' : room.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <CreateRoomModal 
          onClose={() => setIsCreateModalOpen(false)} 
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}

export default ChatSidebar
