import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiPlus, FiUsers, FiMessageCircle } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { useSelector } from 'react-redux'

const ConversationSidebar = ({ rooms, currentRoom, onSelectRoom, onCreateRoom }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useSelector((state) => state.auth)
  const { unreadCounts } = useSelector((state) => state.chat)
  const { onlineUsers } = useSelector((state) => state.presence)

  const filteredRooms = rooms?.filter((room) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const getOtherUser = (room) => {
    if (room.type === 'PRIVATE') {
      return room.participants?.find(p => p.userId !== user?.id)
    }
    return null
  }

  const isUserOnline = (userId) => {
    return Boolean(onlineUsers[userId]?.online)
  }

  const getRoomAvatar = (room) => {
    if (room.type === 'PRIVATE') {
      const otherUser = getOtherUser(room)
      return otherUser?.userName?.charAt(0).toUpperCase() || '?'
    }
    return room.name?.charAt(0).toUpperCase() || '#'
  }

  const getRoomName = (room) => {
    if (room.type === 'PRIVATE') {
      const otherUser = getOtherUser(room)
      return otherUser?.userName || 'Unknown User'
    }
    return room.name || 'Unnamed Room'
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCreateRoom}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors min-h-10 min-w-10 flex items-center justify-center"
            aria-label="Create new conversation"
          >
            <FiPlus size={20} />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all min-h-10"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRooms.map((room) => {
              const otherUser = getOtherUser(room)
              const isOnline = room.type === 'PRIVATE' && otherUser && isUserOnline(otherUser.userId)
              const unreadCount = unreadCounts[room.id] || 0
              const isActive = currentRoom?.id === room.id

              return (
                <motion.div
                  key={room.id}
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  onClick={() => onSelectRoom(room)}
                  className={`p-3 sm:p-4 cursor-pointer transition-colors touch-target min-h-20 sm:min-h-24 flex items-center ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 w-full min-w-0">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                        room.type === 'PRIVATE' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-green-600 to-teal-600'
                      }`}>
                        {room.type === 'GROUP' ? <FiUsers size={20} /> : getRoomAvatar(room)}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {getRoomName(room)}
                        </h3>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate line-clamp-1">
                          {room.lastMessage ? (
                            <>
                              {room.lastMessage.senderName === user?.fullName ? 'You: ' : ''}
                              {room.lastMessage.content}
                            </>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex-shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center">
            <FiMessageCircle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to get started'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCreateRoom}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-10"
              >
                Start Conversation
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationSidebar
