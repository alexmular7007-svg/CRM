import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSend, FiPaperclip, FiSmile, FiX, FiFile } from 'react-icons/fi'
import EmojiPicker from './EmojiPicker'
import toast from 'react-hot-toast'
import api from '../../services/api'

const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.txt', '.md', '.csv',
  '.xls', '.xlsx', '.ppt', '.pptx',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  // Video
  '.mp4', '.mov', '.avi', '.webm',
  // Audio
  '.mp3', '.wav', '.ogg',
]
const ALLOWED_MIME = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Video
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]

const MessageInput = ({ onSendMessage, onTyping, roomId, disabled = false }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Handle keyboard visibility on mobile - scroll input into view
  useEffect(() => {
    const handleFocus = () => {
      // Don't scroll on mobile - let OS handle keyboard
      if (window.innerWidth > 768) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }, 300)
      }
    }

    textareaRef.current?.addEventListener('focus', handleFocus)
    return () => textareaRef.current?.removeEventListener('focus', handleFocus)
  }, [])

  const handleChange = (e) => {
    setMessage(e.target.value)
    if (!isTyping) { 
      setIsTyping(true)
      onTyping?.(true) 
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => { 
      setIsTyping(false)
      onTyping?.(false) 
    }, 3000)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIME.includes(f.type)) {
        toast.error(`${f.name}: unsupported file type`)
        return false
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name}: exceeds 20 MB limit`)
        return false
      }
      return true
    })
    setAttachments((prev) => [...prev, ...valid.map((file) => ({ file }))])
    e.target.value = ''
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const uploadFileAndSend = async (fileObj) => {
    const formData = new FormData()
    formData.append('file', fileObj.file)
    formData.append('roomId', roomId)
    await api.post('/chat/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!message.trim() && attachments.length === 0) || disabled || uploading) return

    if (message.trim()) {
      onSendMessage(message.trim())
    }

    if (attachments.length > 0) {
      if (!roomId) {
        toast.error('No chat room selected')
        return
      }
      setUploading(true)
      try {
        await Promise.all(attachments.map(uploadFileAndSend))
      } catch (err) {
        toast.error('Failed to upload one or more files')
        console.error(err)
      } finally {
        setUploading(false)
      }
    }

    setMessage('')
    setAttachments([])
    setIsTyping(false)
    onTyping?.(false)
    setShowEmojiPicker(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isActive = (message.trim() || attachments.length > 0) && !disabled && !uploading

  return (
    <div ref={containerRef} className="p-2 sm:p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 min-h-[56px] z-40 relative safe-area-bottom">
      {/* Attachments preview - responsive */}
      {attachments.length > 0 && (
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
          {attachments.map(({ file }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2">
                <FiFile size={14} className="flex-shrink-0" />
                <span className="max-w-[100px] sm:max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs opacity-60 flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 flex-shrink-0 touch-target"
                  type="button"
                >
                  <FiX size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-1 sm:gap-2 md:gap-3 w-full">
        {/* Attachment button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center touch-target"
          disabled={disabled || uploading}
          title="Attach file"
        >
          <FiPaperclip size={18} />
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.avi,.webm,.mp3,.wav,.ogg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Message textarea - with better keyboard handling */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Uploading...' : 'Type message...'}
            disabled={disabled || uploading}
            rows={1}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            style={{
              minHeight: '40px',
              maxHeight: '100px',
              WebkitAppearance: 'none',
              WebkitBorderRadius: '16px',
            }}
          />
          <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 z-10 pointer-events-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 min-w-8 min-h-8 flex items-center justify-center touch-target"
              disabled={disabled}
              title="Emoji"
            >
              <FiSmile size={18} />
            </motion.button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Send button - ALWAYS VISIBLE and CLICKABLE */}
        <motion.button
          type="submit"
          whileHover={{ scale: isActive ? 1.05 : 1 }}
          whileTap={{ scale: isActive ? 0.95 : 1 }}
          disabled={!isActive}
          className={`p-2 sm:p-2 md:p-2 rounded-xl font-semibold transition-all flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center touch-target pointer-events-auto ${
            isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          title="Send"
        >
          <FiSend size={18} />
        </motion.button>
      </form>
    </div>
  )
}

export default MessageInput
