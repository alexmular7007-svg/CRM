import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { chatService } from '../services/chatService'
import { websocketService } from '../services/websocketService'
import {
  setRooms,
  setCurrentRoom,
  setMessages,
  addMessage,
  removeMessage,
  addTypingUser,
  removeTypingUser,
  clearUnreadCount,
  incrementUnreadCount,
} from '../store/slices/chatSlice'
import toast from 'react-hot-toast'

export const useChat = (roomId = null) => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { user } = useSelector((state) => state.auth)
  const { currentRoom, messages, typingUsers, isConnected } = useSelector((state) => state.chat)
  const { onlineUsers } = useSelector((state) => state.presence)
  
  const typingTimeoutRef = useRef(null)

  // Fetch chat rooms
  const { data: roomsPage, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatService.getRooms,
  })

  const rooms = useMemo(() => roomsPage?.content ?? roomsPage ?? [], [roomsPage])

  useEffect(() => {
    dispatch(setRooms(rooms))
  }, [dispatch, rooms])

  // Fetch messages for current room
  const {
    data: messagePages,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: ({ pageParam = 0 }) => chatService.getMessages(roomId, { page: pageParam, size: 50 }),
    enabled: !!roomId,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.number ?? 0
      return lastPage && currentPage + 1 < lastPage.totalPages ? currentPage + 1 : undefined
    },
  })

  useEffect(() => {
    if (!roomId || !messagePages?.pages?.length) return
    const orderedMessages = messagePages.pages
      .flatMap((page) => page.content ?? [])
      .reverse()
    dispatch(setMessages({ roomId, messages: orderedMessages }))
  }, [dispatch, messagePages, roomId])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: chatService.sendMessage,
    onMutate: async (messageData) => {
      const clientId = `pending-${Date.now()}`
      dispatch(addMessage({
        roomId: messageData.chatRoomId,
        message: {
          id: clientId,
          clientId,
          chatRoomId: messageData.chatRoomId,
          senderId: user?.id,
          senderName: user?.fullName || 'You',
          senderEmail: user?.email,
          content: messageData.content,
          messageType: messageData.messageType,
          isEdited: false,
          isDeleted: false,
          isPending: true,
          createdAt: new Date().toISOString(),
        },
      }))
      return { clientId, roomId: messageData.chatRoomId }
    },
    onSuccess: (data, _variables, context) => {
      dispatch(addMessage({
        roomId: data.chatRoomId,
        message: { ...data, clientId: context?.clientId },
      }))
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (error, variables, context) => {
      if (context?.clientId) {
        dispatch(removeMessage({ roomId: context.roomId, messageId: context.clientId }))
      }
      
      // Retry if network error (no response or connection refused)
      if (error.response?.status === 0 || error.code === 'ECONNREFUSED' || !error.response) {
        toast.error('Network error. Retrying...')
        
        // Retry after 2 seconds
        setTimeout(() => {
          console.log('Retrying failed message:', variables.content)
          sendMessageMutation.mutate(variables)
        }, 2000)
      } else {
        toast.error(error.message || 'Failed to send message')
      }
    },
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: chatService.markAsRead,
    onSuccess: (_, roomId) => {
      dispatch(clearUnreadCount({ roomId }))
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })

  // Subscribe to chat room
  useEffect(() => {
    if (!roomId || !isConnected) return

    // Subscribe to messages
    const messageSub = websocketService.subscribeToChat(roomId, (message) => {
      // CRITICAL: Only add messages from OTHER users via WebSocket
      // Messages from current user are already added optimistically via mutation
      if (message.senderId !== user?.id) {
        dispatch(addMessage({ roomId, message }))
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        
        // Increment unread count if not current room or window not focused
        if (currentRoom?.id !== roomId || !document.hasFocus()) {
          dispatch(incrementUnreadCount({ roomId }))
        }
      }
    })

    // Subscribe to typing indicators
    const typingSub = websocketService.subscribeToTyping(roomId, (data) => {
      if (data.userId !== user?.id) {
        if (data.isTyping) {
          dispatch(addTypingUser({ roomId, user: data }))
          // Auto-remove after 10 seconds
          setTimeout(() => {
            dispatch(removeTypingUser({ roomId, userId: data.userId }))
          }, 10000)
        } else {
          dispatch(removeTypingUser({ roomId, userId: data.userId }))
        }
      }
    })

    // Mark as read when entering room
    if (currentRoom?.id === roomId) {
      markAsReadMutation.mutate(roomId)
    }

    return () => {
      websocketService.unsubscribeFromChat(roomId)
      websocketService.unsubscribeFromTyping(roomId)
    }
  }, [currentRoom?.id, dispatch, isConnected, queryClient, roomId, user?.id])

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping) => {
    if (!roomId || !isConnected) return

    websocketService.sendTypingIndicator(roomId, isTyping)

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendTypingIndicator(roomId, false)
      }, 3000)
    }
  }, [isConnected, roomId])

  // Send message
  const sendMessage = useCallback((content, messageType = 'TEXT') => {
    if (!roomId || !content.trim()) return

    sendMessageMutation.mutate({
      chatRoomId: roomId,
      content: content.trim(),
      messageType,
    })

    // Stop typing indicator
    sendTypingIndicator(false)
  }, [roomId, sendMessageMutation, sendTypingIndicator])

  // Set current room
  const selectRoom = useCallback((room) => {
    dispatch(setCurrentRoom(room))
    if (room?.id) {
      markAsReadMutation.mutate(room.id)
    }
  }, [dispatch, markAsReadMutation])

  return {
    rooms,
    currentRoom,
    messages: messages[roomId] || [],
    typingUsers: typingUsers[roomId] || [],
    // Return the full onlineUsers map so components can check .online and .lastSeen
    onlineUsers,
    isConnected,
    roomsLoading,
    messagesLoading,
    fetchOlderMessages: fetchNextPage,
    hasOlderMessages: hasNextPage,
    isFetchingOlderMessages: isFetchingNextPage,
    sendMessage,
    sendTypingIndicator,
    selectRoom,
    isSending: sendMessageMutation.isPending,
  }
}
