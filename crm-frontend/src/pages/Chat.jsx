import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMessageSquare, FiArrowLeft } from 'react-icons/fi'
import { useChat } from '../hooks/useChat'
import { websocketService } from '../services/websocketService'
import ConversationSidebar from '../components/chat/ConversationSidebar'
import ChatHeader from '../components/chat/ChatHeader'
import MessageArea from '../components/chat/MessageArea'
import MessageInput from '../components/chat/MessageInput'
import CreateRoomModal from '../components/chat/CreateRoomModal'
import RoomInfoPanel from '../components/chat/RoomInfoPanel'
import MessageSearch from '../components/chat/MessageSearch'
import ChatAIPanel from '../components/ai/ChatAIPanel'
import Spinner from '../components/common/Spinner'
import { useAutoRefreshOnMemberRemoval } from '../hooks/useAutoRefreshOnMemberRemoval'
import { useQueryClient } from '@tanstack/react-query'

const Chat = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace)
  const workspaceId = currentWorkspace?.id
  const [showInfo, setShowInfo] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(workspaceId, queryClient)
  const {
    rooms,
    currentRoom,
    messages,
    typingUsers,
    isConnected,
    roomsLoading,
    messagesLoading,
    sendMessage,
    sendTypingIndicator,
    selectRoom,
    fetchOlderMessages,
    hasOlderMessages,
    isFetchingOlderMessages,
  } = useChat(roomId ? parseInt(roomId) : null)

  // Set room from URL
  useEffect(() => {
    if (roomId && rooms) {
      const room = rooms.find((r) => r.id === parseInt(roomId))
      if (room && (!currentRoom || currentRoom.id !== room.id)) {
        selectRoom(room)
      }
    }
  }, [roomId, rooms, currentRoom, selectRoom])

  const handleSelectRoom = (room) => {
    selectRoom(room)
    navigate(`/chat/${room.id}`)
    setShowMobileSidebar(false)
  }

  const handleCreateRoom = () => {
    setShowCreateModal(true)
  }

  const handleSelectMessage = (message) => {
    setShowSearch(false)
    requestAnimationFrame(() => {
      document.getElementById(`message-${message.id}`)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    })
  }

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - Hidden on mobile/tablet, visible on lg+ */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ConversationSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
        />
      </div>

      {/* Mobile Sidebar Drawer - Only on mobile/tablet */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 z-50 lg:hidden flex flex-col overflow-hidden"
            >
              <ConversationSidebar
                rooms={rooms}
                currentRoom={currentRoom}
                onSelectRoom={handleSelectRoom}
                onCreateRoom={handleCreateRoom}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
        {currentRoom ? (
          <>
            {/* Mobile Header with Back Button */}
            <div className="lg:hidden border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 bg-white dark:bg-gray-800">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle sidebar"
              >
                <FiArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </motion.button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">{currentRoom?.name}</h2>
              </div>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm text-center">
                Reconnecting to chat...
              </div>
            )}

            {/* Chat Header - Desktop only */}
            <div className="hidden lg:block">
              <ChatHeader 
                room={currentRoom} 
                onShowInfo={() => setShowInfo(!showInfo)}
                onShowSearch={() => setShowSearch(!showSearch)}
                onShowAI={() => setShowAI(!showAI)}
              />
            </div>

            {showAI && (
              <div className="border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 dark:border-gray-700 dark:from-cyan-950/20 dark:to-blue-950/20">
                <ChatAIPanel room={currentRoom} messages={messages} onSendMessage={sendMessage} />
              </div>
            )}

            {/* Messages */}
            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <MessageArea
                messages={messages}
                typingUsers={typingUsers}
                onLoadOlder={fetchOlderMessages}
                hasOlderMessages={hasOlderMessages}
                isFetchingOlderMessages={isFetchingOlderMessages}
              />
            )}

            {/* Message Input */}
            <MessageInput
              onSendMessage={sendMessage}
              onTyping={sendTypingIndicator}
              roomId={currentRoom?.id}
              disabled={!isConnected}
              onRetryConnect={() => {
                if (!isConnected) {
                  websocketService.connect()
                }
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <FiMessageSquare size={48} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a conversation from the sidebar to start chatting
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateRoom}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start New Conversation
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Room Info Panel */}
      <RoomInfoPanel
        room={currentRoom}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />

      {/* Message Search */}
      {showSearch && currentRoom && (
        <MessageSearch
          messages={messages}
          onSelectMessage={handleSelectMessage}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        workspaceId={workspaceId}
      />
    </div>
  )
}

export default Chat
