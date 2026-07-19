import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useSelector } from 'react-redux'
import { FiEdit2, FiCheck, FiChevronUp, FiDownload, FiAlertCircle } from 'react-icons/fi'
import attachmentService from '../../services/attachmentService'
import toast from 'react-hot-toast'

const MessageArea = ({
  messages,
  typingUsers,
  onLoadOlder,
  hasOlderMessages = false,
  isFetchingOlderMessages = false,
}) => {
  const messagesEndRef = useRef(null)
  const { user } = useSelector((state) => state.auth)
  const [downloadingId, setDownloadingId] = useState(null)
  const [attachmentUrls, setAttachmentUrls] = useState({})  // Cache signed URLs

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatMessageDate = (date) => {
    const messageDate = new Date(date)
    if (isToday(messageDate)) {
      return 'Today'
    } else if (isYesterday(messageDate)) {
      return 'Yesterday'
    } else {
      return format(messageDate, 'MMMM d, yyyy')
    }
  }

  const formatMessageTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    // "Today" → "10:42 PM"
    if (isToday(d)) return format(d, 'h:mm a')
    // "Yesterday" → "Yesterday 10:42 PM"
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
    // Older → "04 Jun 2026 22:42"
    return format(d, 'dd MMM yyyy HH:mm')
  }

  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true
    return !isSameDay(new Date(currentMsg.createdAt), new Date(previousMsg.createdAt))
  }

  const shouldGroupMessage = (currentMsg, previousMsg) => {
    if (!previousMsg) return false
    if (currentMsg.senderId !== previousMsg.senderId) return false
    
    const timeDiff = new Date(currentMsg.createdAt) - new Date(previousMsg.createdAt)
    return timeDiff < 60000 // Group if within 1 minute
  }

  /**
   * PHASE 4: Handle file attachment download
   * PHASE 8: Security - backend validates permissions
   * 
   * For Cloudinary: all files are served via secure URLs
   * - Images open in new tab for preview
   * - PDFs/Videos downloaded with proper filename and extension
   */
  const handleDownloadAttachment = async (msg) => {
    try {
      setDownloadingId(msg.id)
      
      // Get signed URL + metadata from backend (validates permissions)
      const urlData = await attachmentService.getDownloadUrl(msg.attachmentId)
      const downloadUrl = urlData.downloadUrl
      const filename = urlData.filename || msg.attachmentName || 'download'
      
      // For ALL file types, use the Cloudinary secure URL directly
      if (msg.messageType === 'IMAGE') {
        // Images open in new tab for preview
        window.open(downloadUrl, '_blank')
      } else {
        // PDFs and other files: download via secure URL with original filename
        // Browser will handle the download based on Content-Type header from Cloudinary
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename  // ✅ Use original filename with extension
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const groupedMessages = messages.reduce((acc, msg, index) => {
    const prevMsg = messages[index - 1]
    
    if (shouldShowDateSeparator(msg, prevMsg)) {
      acc.push({ type: 'date', date: msg.createdAt })
    }
    
    acc.push({
      type: 'message',
      message: msg,
      grouped: shouldGroupMessage(msg, prevMsg),
    })
    
    return acc
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 min-h-0 bg-white dark:bg-gray-800">
      {groupedMessages.length > 0 ? (
        <>
          {hasOlderMessages && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={() => onLoadOlder?.()}
                disabled={isFetchingOlderMessages}
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800/80 dark:text-gray-200 dark:ring-gray-700 min-h-10"
              >
                <FiChevronUp size={16} />
                {isFetchingOlderMessages ? 'Loading older messages...' : 'Load older messages'}
              </button>
            </div>
          )}
          {groupedMessages.map((item, index) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${index}`} className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                    {formatMessageDate(item.date)}
                  </div>
                </div>
              )
            }

            const msg = item.message
            const isOwn = msg.senderId === user?.id
            const showAvatar = !item.grouped

            return (
              <motion.div
                key={msg.id}
                id={`message-${msg.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${item.grouped ? 'mt-0.5 sm:mt-1' : 'mt-2 sm:mt-4'}`}
              >
                <div className={`flex items-end space-x-2 max-w-xs sm:max-w-sm md:max-w-2xl ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  {showAvatar && !isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                      {msg.senderName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!showAvatar && !isOwn && <div className="w-8" />}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-2">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`px-3 sm:px-4 py-2 rounded-2xl break-words ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                      } ${msg.isDeleted ? 'italic opacity-60' : ''}`}
                    >
                      {/* PHASE 4 + PHASE 6: Image attachment with signed URL */}
                      {msg.messageType === 'IMAGE' && msg.attachmentId && (
                        <div className="mb-2">
                          <ImageThumbnail 
                            msg={msg} 
                            isOwn={isOwn}
                            downloadingId={downloadingId}
                            onDownload={() => handleDownloadAttachment(msg)}
                          />
                        </div>
                      )}

                      {/* PHASE 4 + PHASE 6: File attachment with signed URL */}
                      {msg.messageType === 'FILE' && msg.attachmentId && (
                        <button
                          onClick={() => handleDownloadAttachment(msg)}
                          disabled={downloadingId === msg.id}
                          className={`w-full flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border transition-colors ${
                            isOwn
                              ? 'border-blue-400 hover:bg-blue-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'
                          } ${downloadingId === msg.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-lg flex-shrink-0">
                            {downloadingId === msg.id ? '⌛' : '📎'}
                          </span>
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {msg.attachmentName || msg.content}
                            </p>
                            {msg.attachmentSize && (
                              <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                {(msg.attachmentSize / 1024).toFixed(0)} KB · {downloadingId === msg.id ? 'Downloading...' : 'Click to download'}
                              </p>
                            )}
                          </div>
                          <FiDownload className="flex-shrink-0 ml-auto" />
                        </button>
                      )}

                      {/* Text content (always shown for TEXT, shown as filename for files) */}
                      {msg.messageType === 'TEXT' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <div className={`flex items-center space-x-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {msg.isEdited && (
                          <span className={`text-xs flex items-center space-x-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            <FiEdit2 size={10} />
                            <span>edited</span>
                          </span>
                        )}
                        {isOwn && (
                          <FiCheck size={14} className="text-blue-100" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Typing Indicators */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {typingUsers[0].userName?.charAt(0).toUpperCase()}
                </div>
                <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-sm">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FiCheck size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start the conversation by sending a message
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ImageThumbnail Component
 * Handles loading images from signed URLs obtained via attachment ID
 */
const ImageThumbnail = ({ msg, isOwn, downloadingId, onDownload }) => {
  const [displayUrl, setDisplayUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // MUST use attachmentId, NOT attachmentUrl or filename
    if (!msg.attachmentId) {
      console.error('Missing attachmentId for image:', msg.id)
      setError(true)
      setLoading(false)
      return
    }

    // Fetch signed URL from backend using attachment ID
    const fetchSignedUrl = async () => {
      try {
        setLoading(true)
        setError(false)
        const urlData = await attachmentService.getDownloadUrl(msg.attachmentId)
        // ✅ Extract downloadUrl from response object
        setDisplayUrl(urlData.downloadUrl)
      } catch (err) {
        console.error('Failed to get signed URL for attachment', msg.attachmentId, err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrl()
  }, [msg.attachmentId, msg.id])

  return (
    <button
      onClick={onDownload}
      disabled={downloadingId === msg.id}
      className="relative group"
      title="Click to view/download"
    >
      {loading && (
        <div className="absolute inset-0 bg-gray-300 rounded-lg flex items-center justify-center z-10">
          <div className="text-gray-600 text-sm">Loading image...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-red-600 text-sm">Failed to load image</div>
        </div>
      )}
      {!loading && displayUrl && (
        <img
          src={displayUrl}
          alt={msg.attachmentName || 'image'}
          className="max-w-xs sm:max-w-sm md:max-w-md max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.target.style.opacity = '0.3'
            console.error('Image failed to load from signed URL:', displayUrl)
            setError(true)
          }}
        />
      )}
      {downloadingId === msg.id && (
        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-20">
          <div className="text-white text-sm">Downloading...</div>
        </div>
      )}
    </button>
  )
}

export default MessageArea
