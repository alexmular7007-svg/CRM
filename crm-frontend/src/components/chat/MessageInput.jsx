import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSend, FiPaperclip, FiSmile, FiX, FiFile } from 'react-icons/fi'
import EmojiPicker from './EmojiPicker'
import toast from 'react-hot-toast'
import api from '../../services/api'

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
]
const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]

const MessageInput = ({ onSendMessage, onTyping, roomId, disabled = false }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])   // { file, preview? }
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  const handleChange = (e) => {
    setMessage(e.target.value)
    if (!isTyping) { setIsTyping(true); onTyping?.(true) }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); onTyping?.(false) }, 3000)
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
    // Reset so the same file can be selected again
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
    // api interceptor already adds Authorization header
    await api.post('/chat/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // The backend broadcasts the message via WebSocket — no need to dispatch here
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ((!message.trim() && attachments.length === 0) || disabled || uploading) return

    // Send text message
    if (message.trim()) {
      onSendMessage(message.trim())
    }

    // Upload each file
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
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map(({ file }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center space-x-2">
                <FiFile size={14} />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs opacity-60">({(file.size / 1024).toFixed(0)} KB)</span>
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <FiX size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          disabled={disabled || uploading}
          title="Attach file (PDF, DOCX, XLSX, PPTX, images)"
        >
          <FiPaperclip size={20} />
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Message textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Uploading...' : 'Type a message...'}
            disabled={disabled || uploading}
            rows={1}
            className="w-full px-4 py-3 pr-12 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '48px',
              maxHeight: '120px',
              backgroundColor: 'rgb(243, 244, 246)',
              color: 'rgb(17, 24, 39)',
              caretColor: 'rgb(59, 130, 246)',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'rgb(249, 250, 251)'
              e.target.style.color = 'rgb(17, 24, 39)'
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgb(243, 244, 246)'
              e.target.style.color = 'rgb(17, 24, 39)'
            }}
          />
          <div className="absolute right-3 bottom-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={disabled}
            >
              <FiSmile size={20} />
            </motion.button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Send button */}
        <motion.button
          type="submit"
          whileHover={{ scale: isActive ? 1.05 : 1 }}
          whileTap={{ scale: isActive ? 0.95 : 1 }}
          disabled={!isActive}
          className={`p-3 rounded-xl font-semibold transition-all ${
            isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <FiSend size={20} />
        </motion.button>
      </form>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}

export default MessageInput
