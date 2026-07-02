import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSearch, FiUsers, FiUser } from 'react-icons/fi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chatService'
import { userService } from '../../services/userService'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'
import { useAutoRefreshOnMemberRemoval } from '../../hooks/useAutoRefreshOnMemberRemoval'

const CreateRoomModal = ({ isOpen, onClose, workspaceId = null }) => {
  const [roomType, setRoomType] = useState('PRIVATE')
  const [roomName, setRoomName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const queryClient = useQueryClient()

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(workspaceId, queryClient)

  // Validate workspace ID is available
  if (isOpen && !workspaceId) {
    console.warn('CreateRoomModal: workspaceId is required but not provided')
  }

  // Fetch users for selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => userService.searchUsers(searchQuery),
    enabled: isOpen,
  })

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: ({ roomType, roomData, selectedUsers }) => {
      if (roomType === 'PRIVATE') {
        return chatService.getOrCreatePrivateChat(selectedUsers[0].id, workspaceId)
      }
      return chatService.createRoom(roomData)
    },
    onSuccess: (data) => {
      toast.success('Chat room created successfully')
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      onClose()
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create chat room')
    },
  })

  const resetForm = () => {
    setRoomType('PRIVATE')
    setRoomName('')
    setSearchQuery('')
    setSelectedUsers([])
  }

  const handleUserToggle = (user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id)
      if (exists) {
        return prev.filter((u) => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (roomType === 'PRIVATE' && selectedUsers.length !== 1) {
      toast.error('Please select exactly one user for private chat')
      return
    }

    if (roomType === 'GROUP' && selectedUsers.length < 2) {
      toast.error('Please select at least 2 users for group chat')
      return
    }

    if (roomType === 'GROUP' && !roomName.trim()) {
      toast.error('Please enter a room name')
      return
    }

    const roomData = {
      type: roomType,
      name: roomType === 'GROUP' ? roomName : null,
      workspaceId: workspaceId,
      participantIds: selectedUsers.map((u) => u.id),
    }

    createRoomMutation.mutate({ roomType, roomData, selectedUsers })
  }

  const userList = users?.content ?? users ?? []
  const filteredUsers = userList.filter((user) =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Conversation
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX size={24} className="text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Room Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Conversation Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRoomType('PRIVATE')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    roomType === 'PRIVATE'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FiUser size={24} className={`mx-auto mb-2 ${
                    roomType === 'PRIVATE' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Direct Message
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    One-on-one conversation
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRoomType('GROUP')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    roomType === 'GROUP'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FiUsers size={24} className={`mx-auto mb-2 ${
                    roomType === 'GROUP' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Group Chat
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Multiple participants
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Group Name (only for GROUP type) */}
            {roomType === 'GROUP' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            {/* User Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {roomType === 'PRIVATE' ? 'Select User' : 'Add Participants'}
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    <span className="text-sm font-medium">{user.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleUserToggle(user)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* User List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="md" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.find((u) => u.id === user.id)
                    return (
                      <motion.div
                        key={user.id}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        onClick={() => handleUserToggle(user)}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <FiX size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={createRoomMutation.isPending || selectedUsers.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {createRoomMutation.isPending && <Spinner size="sm" />}
                <span>Create Conversation</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CreateRoomModal
