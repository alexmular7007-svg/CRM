import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, shallowEqual } from 'react-redux'
import { motion } from 'framer-motion'
import { FiMessageSquare, FiArrowLeft, FiPlus, FiUsers, FiInfo } from 'react-icons/fi'
import { Sparkles, X } from 'lucide-react'
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
import MobileDrawer from '../components/layout/MobileDrawer'
import { useAutoRefreshOnMemberRemoval } from '../hooks/useAutoRefreshOnMemberRemoval'
import { useQueryClient } from '@tanstack/react-query'

// ✅ Message skeleton loader for smooth loading
const MessageSkeleton = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex gap-3 mb-4"
  >
    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    </div>
  </motion.div>
))
MessageSkeleton.displayName = 'MessageSkeleton'

// ✅ Messages area skeleton
const MessagesLoadingSkeleton = memo(() => (
  <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
    {[...Array(5)].map((_, i) => (
      <MessageSkeleton key={i} />
    ))}
  </div>
))
MessagesLoadingSkeleton.displayName = 'MessagesLoadingSkeleton'

const Chat = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Memoized selectors to prevent unnecessary re-renders
  const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace, shallowEqual)
  const currentUser = useSelector((state) => state.auth.user, shallowEqual)
  
  const workspaceId = currentWorkspace?.id
  const [showInfo, setShowInfo] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  // PHASE 7: Auto-refresh when member is removed from workspace
  useAutoRefreshOnMemberRemoval(workspaceId, queryClient)

  // Track screen size for responsive behavior with memoized callback
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 1024)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

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

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleSelectRoom = useCallback((room) => {
    selectRoom(room)
    navigate(`/chat/${room.id}`)
  }, [selectRoom, navigate])

  const handleCreateRoom = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleSelectMessage = useCallback((message) => {
    setShowSearch(false)
    requestAnimationFrame(() => {
      document.getElementById(`message-${message.id}`)?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    })
  }, [])

  // Handle room creation and auto-navigate on mobile
  const handleRoomCreated = useCallback((newRoom) => {
    setShowCreateModal(false)
    selectRoom(newRoom)
    if (isMobile) {
      navigate(`/chat/${newRoom.id}`)
    }
  }, [selectRoom, isMobile, navigate])

  if (roomsLoading) {
    return (
      <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Left Sidebar - Loading */}
        <div className="hidden lg:flex lg:flex-col lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
            ></motion.div>
          ))}
        </div>

        {/* Main Area - Loading */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse"></div>
          <MessagesLoadingSkeleton />
          <div className="h-20 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // MOBILE: Show conversations list when no roomId
  if (isMobile && !roomId) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
        {/* Mobile Header - Conversations List */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800 flex-shrink-0 h-14">
          <h1 className="font-semibold text-gray-900 dark:text-white text-base">Messages</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateRoom}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-10 min-w-10 flex items-center justify-center"
            aria-label="Create new conversation"
            title="New conversation"
          >
            <FiPlus size={20} className="text-gray-700 dark:text-gray-300" />
          </motion.button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {rooms.length > 0 ? (
            <ConversationSidebar
              rooms={rooms}
              currentRoom={null}
              onSelectRoom={handleSelectRoom}
              onCreateRoom={handleCreateRoom}
              isCompactMobile={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center px-4"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <FiMessageSquare size={40} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Conversations Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Start a new conversation to begin chatting
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateRoom}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <FiPlus size={18} />
                  New Conversation
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Create Room Modal - Bottom Sheet on Mobile */}
        <MobileDrawer
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          position="bottom"
          maxHeight="90vh"
          isDismissible={true}
        >
          <div className="flex flex-col h-full">
            <CreateRoomModal
              isOpen={true}
              onClose={() => setShowCreateModal(false)}
              workspaceId={workspaceId}
              onRoomCreated={handleRoomCreated}
            />
          </div>
        </MobileDrawer>
      </div>
    )
  }

  // MOBILE: Show full-screen chat when roomId is set
  if (isMobile && roomId) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-gray-800 overflow-hidden safe-area-inset">
        {currentRoom ? (
          <>
            {/* Mobile Chat Header with Back Button - Optimized */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 flex-shrink-0 h-14 safe-area-top">
              {/* Back Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/chat')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center"
                aria-label="Back to conversations"
                title="Back"
              >
                <FiArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
              </motion.button>

              {/* Room Info - Centered */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                  currentRoom?.type === 'PRIVATE' ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-green-600 to-teal-600'
                }`}>
                  {currentRoom?.type === 'GROUP' ? <FiUsers size={16} /> : (currentRoom?.name?.charAt(0).toUpperCase() || '?')}
                </div>
                {/* Name and Status */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {currentRoom?.type === 'PRIVATE' 
                      ? currentRoom.participants?.find(p => p.userId !== currentUser?.id)?.userName || 'Unknown User'
                      : currentRoom?.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRoom?.type === 'PRIVATE' ? 'Online' : `${currentRoom?.participants?.length || 0} members`}
                  </p>
                </div>
              </div>

              {/* Mobile Header Actions - Compact */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center"
                title="AI Assistant"
                onClick={() => setShowAI(!showAI)}
              >
                <Sparkles size={18} className="text-gray-700 dark:text-gray-300" />
              </motion.button>

              {/* Info menu button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center"
                title="Room Info"
                onClick={() => setShowInfo(!showInfo)}
                aria-label="Room Information"
              >
                <FiInfo size={18} className="text-gray-700 dark:text-gray-300" />
              </motion.button>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-xs sm:text-sm text-center flex-shrink-0">
                Reconnecting to chat...
              </div>
            )}

            {/* Messages - Scrollable */}
            {messagesLoading ? (
              <MessagesLoadingSkeleton />
            ) : (
              <MessageArea
                messages={messages}
                typingUsers={typingUsers}
                onLoadOlder={fetchOlderMessages}
                hasOlderMessages={hasOlderMessages}
                isFetchingOlderMessages={isFetchingOlderMessages}
              />
            )}

            {/* Room Info Panel - Mobile bottom sheet */}
            {showInfo && isMobile && (
              <RoomInfoPanel
                room={currentRoom}
                isOpen={true}
                onClose={() => setShowInfo(false)}
              />
            )}

            {/* AI Panel - Mobile bottom sheet */}
            {showAI && isMobile && (
              <MobileDrawer
                isOpen={true}
                onClose={() => setShowAI(false)}
                position="bottom"
                maxHeight="60vh"
                isDismissible={true}
              >
                <div className="flex flex-col h-full">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 flex-shrink-0 flex items-center justify-between min-h-12">
                    <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
                    <motion.button
                      onClick={() => setShowAI(false)}
                      className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                  <ChatAIPanel room={currentRoom} messages={messages} onSendMessage={sendMessage} />
                </div>
              </MobileDrawer>
            )}

            {/* AI Panel - Desktop inline */}
            {showAI && !isMobile && (
              <div className="border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-3 dark:border-gray-700 dark:from-cyan-950/20 dark:to-blue-950/20 flex-shrink-0">
                <ChatAIPanel room={currentRoom} messages={messages} onSendMessage={sendMessage} />
              </div>
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
                Loading Chat
              </h2>
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  // DESKTOP: Split-view layout (conversation list + chat)
  return (
    <div className="flex h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ConversationSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
        {currentRoom ? (
          <>
            {/* Desktop Chat Header */}
            <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700">
              <ChatHeader 
                room={currentRoom} 
                onShowInfo={() => setShowInfo(!showInfo)}
                onShowSearch={() => setShowSearch(!showSearch)}
                onShowAI={() => setShowAI(!showAI)}
              />
            </div>

            {/* AI Panel */}
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
        onRoomCreated={handleRoomCreated}
      />
    </div>
  )
}

export default Chat
