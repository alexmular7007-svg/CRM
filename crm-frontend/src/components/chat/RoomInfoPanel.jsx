import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX, FiUsers, FiUserPlus, FiUserMinus, FiFile,
  FiTrash2, FiLogOut, FiSlash, FiAlertTriangle, FiShield
} from 'react-icons/fi'
import { format } from 'date-fns'
import { useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chatService'
import toast from 'react-hot-toast'
import MobileDrawer from '../layout/MobileDrawer'

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
const ConfirmDialog = ({ isOpen, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="text-red-600 dark:text-red-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RoomInfoPanel = ({ room, isOpen, onClose }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('members')
  const [confirm, setConfirm] = useState(null) // { type, payload }
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 1024)
  const { user } = useSelector((state) => state.auth)
  const { onlineUsers } = useSelector((state) => state.presence)
  const queryClient = useQueryClient()

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isUserOnline = (userId) => Boolean(onlineUsers[userId]?.online ?? onlineUsers[userId])
  const isCreator = room?.createdById === user?.id

  // ── Fetch blocked users ──────────────────────────────────────────────────
  const { data: blockedIds = [] } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: chatService.getBlockedUsers,
    staleTime: 60000,
  })
  const blockedSet = new Set(Array.isArray(blockedIds) ? blockedIds : [])

  // ── Remove participant ───────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: ({ roomId, userId }) => chatService.removeParticipant(roomId, userId),
    onSuccess: (_, { userId }) => {
      if (userId === user?.id) {
        // Current user left — close panel and go back to chat list
        onClose()
        navigate('/chat')
      }
      toast.success('Removed from conversation')
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove'),
  })

  // ── Block user ───────────────────────────────────────────────────────────
  const blockMutation = useMutation({
    mutationFn: chatService.blockUser,
    onSuccess: () => {
      toast.success('User blocked')
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to block user'),
  })

  // ── Unblock user ─────────────────────────────────────────────────────────
  const unblockMutation = useMutation({
    mutationFn: chatService.unblockUser,
    onSuccess: () => {
      toast.success('User unblocked')
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to unblock user'),
  })

  // ── Delete room ──────────────────────────────────────────────────────────
  const deleteRoomMutation = useMutation({
    mutationFn: () => chatService.deleteRoom(room.id),
    onSuccess: () => {
      toast.success('Chat deleted')
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      onClose()
      navigate('/chat')
    },
    onError: (err) => toast.error(err?.message || 'Failed to delete chat'),
  })

  // ── Confirm dialog helpers ───────────────────────────────────────────────
  const openConfirm = (type, payload) => setConfirm({ type, payload })
  const closeConfirm = () => setConfirm(null)

  const handleConfirm = () => {
    if (!confirm) return
    const { type, payload } = confirm
    closeConfirm()
    if (type === 'remove') removeMutation.mutate({ roomId: room.id, userId: payload.userId })
    if (type === 'leave') removeMutation.mutate({ roomId: room.id, userId: user.id })
    if (type === 'block') blockMutation.mutate(payload.userId)
    if (type === 'delete') deleteRoomMutation.mutate()
  }

  if (!isOpen || !room) return null

  // Dialog config per action type
  const DIALOG_CONFIG = {
    remove: {
      title: 'Remove member',
      message: `Remove ${confirm?.payload?.userName} from this conversation? They won't be able to see new messages.`,
      confirmLabel: 'Remove',
      confirmClass: 'bg-red-600 hover:bg-red-700',
    },
    leave: {
      title: 'Leave conversation',
      message: 'You will no longer receive messages from this group. You can be re-added by a member.',
      confirmLabel: 'Leave',
      confirmClass: 'bg-red-600 hover:bg-red-700',
    },
    block: {
      title: 'Block user',
      message: `Block ${confirm?.payload?.userName}? They won't be able to send you messages. You can unblock them later.`,
      confirmLabel: 'Block',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
    },
    delete: {
      title: 'Delete chat',
      message: 'This will permanently delete the chat and ALL messages for everyone. This cannot be undone.',
      confirmLabel: 'Delete forever',
      confirmClass: 'bg-red-600 hover:bg-red-700',
    },
  }

  const cfg = confirm ? DIALOG_CONFIG[confirm.type] : null

  // ─── Room Info Content - Reusable for mobile and desktop ───────────────────
  const RoomInfoContent = () => (
    <div className="flex-1 overflow-y-auto p-5">
      {/* ─── MEMBERS TAB ─── */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {room.type === 'GROUP' && isCreator && (
            <button className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-sm">
              <FiUserPlus size={16} />
              Add Member
            </button>
          )}

          {room.participants?.map((participant) => {
            const isOnline = isUserOnline(participant.userId)
            const isMe = participant.userId === user?.id
            const isBlocked = blockedSet.has(participant.userId)
            const canRemove = isCreator && !isMe && room.type === 'GROUP'
            const canBlock = !isMe

            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {participant.userName?.charAt(0).toUpperCase()}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {participant.userName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-gray-400">(You)</span>
                      )}
                      {participant.userId === room.createdById && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-semibold rounded-full">
                          Owner
                        </span>
                      )}
                      {isBlocked && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{participant.userEmail}</div>
                  </div>
                </div>

                {/* Action buttons */}
                {!isMe && (
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {/* Block / Unblock */}
                    {canBlock && (
                      <button
                        onClick={() => {
                          if (isBlocked) {
                            unblockMutation.mutate(participant.userId)
                          } else {
                            openConfirm('block', { userId: participant.userId, userName: participant.userName })
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors text-xs ${
                          isBlocked
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        }`}
                        title={isBlocked ? 'Unblock user' : 'Block user'}
                      >
                        <FiSlash size={15} />
                      </button>
                    )}
                    {/* Remove from group */}
                    {canRemove && (
                      <button
                        onClick={() => openConfirm('remove', { userId: participant.userId, userName: participant.userName })}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove from group"
                      >
                        <FiUserMinus size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─── FILES TAB ─── */}
      {activeTab === 'files' && (
        <div className="text-center py-12">
          <FiFile size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No files yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Files shared in this conversation will appear here
          </p>
        </div>
      )}

      {/* ─── ACTIONS TAB ─── */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Conversation Actions
          </p>

          {/* Leave group (non-creators in group chats) */}
          {room.type === 'GROUP' && !isCreator && (
            <button
              onClick={() => openConfirm('leave', {})}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiLogOut size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
                  Leave Group
                </p>
                <p className="text-xs text-gray-500">Stop receiving messages from this group</p>
              </div>
            </button>
          )}

          {/* Delete chat (creator only) */}
          {isCreator && (
            <button
              onClick={() => openConfirm('delete', {})}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiTrash2 size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
                  Delete Chat
                </p>
                <p className="text-xs text-gray-500">Permanently delete this conversation and all messages</p>
              </div>
            </button>
          )}

          {/* Leave private chat */}
          {room.type === 'PRIVATE' && (
            <button
              onClick={() => openConfirm('leave', {})}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiLogOut size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">
                  Leave Conversation
                </p>
                <p className="text-xs text-gray-500">Remove yourself from this direct message</p>
              </div>
            </button>
          )}

          {/* Blocked users summary */}
          {blockedSet.size > 0 && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center gap-2 mb-2">
                <FiSlash size={14} className="text-orange-500" />
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                  {blockedSet.size} blocked {blockedSet.size === 1 ? 'user' : 'users'}
                </p>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400/70">
                Go to Members tab to unblock individual users.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <ConfirmDialog
        isOpen={!!confirm}
        title={cfg?.title}
        message={cfg?.message}
        confirmLabel={cfg?.confirmLabel}
        confirmClass={cfg?.confirmClass}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {/* MOBILE: Display as a bottom sheet drawer */}
      {isMobile && (
        <MobileDrawer
          isOpen={isOpen}
          onClose={onClose}
          position="bottom"
          maxHeight="90vh"
          isDismissible={true}
        >
          <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
            {/* Header - Fixed */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 ${
                  room.type === 'PRIVATE'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                    : 'bg-gradient-to-br from-green-600 to-teal-600'
                }`}>
                  {room.type === 'GROUP' ? <FiUsers size={28} /> : room.name?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{room.name || 'Unnamed Room'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {room.type === 'PRIVATE' ? 'Direct Message' : `${room.participants?.length || 0} members`}
                </p>
              </div>
            </div>

            {/* Tabs - Fixed */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {['members', 'files', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'members' && <FiUsers className="inline mr-1" size={13} />}
                  {tab === 'files' && <FiFile className="inline mr-1" size={13} />}
                  {tab === 'actions' && <FiShield className="inline mr-1" size={13} />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Content - Scrollable */}
            <RoomInfoContent />
          </div>
        </MobileDrawer>
      )}

      {/* DESKTOP: Display as a side panel */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[100] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 z-10 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Room Info</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiX size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 ${
                    room.type === 'PRIVATE'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                      : 'bg-gradient-to-br from-green-600 to-teal-600'
                  }`}>
                    {room.type === 'GROUP' ? <FiUsers size={28} /> : room.name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{room.name || 'Unnamed Room'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {room.type === 'PRIVATE' ? 'Direct Message' : `${room.participants?.length || 0} members`}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                {['members', 'files', 'actions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'members' && <FiUsers className="inline mr-1" size={13} />}
                    {tab === 'files' && <FiFile className="inline mr-1" size={13} />}
                    {tab === 'actions' && <FiShield className="inline mr-1" size={13} />}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content */}
              <RoomInfoContent />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

export default RoomInfoPanel
