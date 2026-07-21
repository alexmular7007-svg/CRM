import api from './api'

/**
 * PHASE 4 + PHASE 6: Attachment Service
 * 
 * Handles attachment download and URL generation from backend.
 * Frontend never directly accesses Supabase Storage - always goes through backend API
 * for security and permission validation.
 */

const attachmentService = {
  /**
   * Get a signed download URL for an attachment with metadata
   * 
   * PHASE 4 + PHASE 8: Security - backend validates permissions before generating URL
   * 
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<Object>} - Object with { downloadUrl, filename, mimeType, fileSize, resourceType }
   */
  async getDownloadUrl(attachmentId) {
    try {
      const response = await api.get(`/attachments/${attachmentId}/url`)
      // API interceptor returns response.data which is the full ApiResponse
      // Structure: { success: true, message: "...", data: { downloadUrl, filename, ... } }
      // We need to extract the inner 'data' object
      if (response && response.data) {
        // response.data contains the DownloadUrlResponse object
        return response.data
      }
      return response
    } catch (error) {
      console.error('Failed to get download URL:', error)
      throw error
    }
  },

  /**
   * Get just the URL string (for backward compatibility)
   * 
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<string>} - Just the download URL
   */
  async getDownloadUrlString(attachmentId) {
    const response = await this.getDownloadUrl(attachmentId)
    return response.downloadUrl
  },

  /**
   * Download attachment directly as stream
   * 
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<Blob>} - File blob
   */
  async downloadAttachment(attachmentId) {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Failed to download attachment:', error)
      throw error
    }
  },

  /**
   * Delete an attachment
   * 
   * @param {number} attachmentId - The attachment ID
   */
  async deleteAttachment(attachmentId) {
    try {
      await api.delete(`/attachments/${attachmentId}`)
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      throw error
    }
  },

  /**
   * Trigger a file download from a Blob
   * 
   * @param {Blob} blob - The file blob
   * @param {string} filename - The filename to save as
   */
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  /**
   * Get full download URL for displaying/opening in new tab
   * Uses signed URL endpoint
   * 
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<string>} - Full public signed URL
   */
  async getPublicDownloadUrl(attachmentId) {
    return this.getDownloadUrl(attachmentId)
  },

  /**
   * Check if a URL is already a signed URL (starts with https://)
   * or a storage path that needs to be converted
   * 
   * @param {string} url - The URL or storage path
   * @returns {boolean} - True if already a full URL
   */
  isFullUrl(url) {
    return url && url.startsWith('https://')
  },

  /**
   * Get a displayable URL - either use provided URL or generate signed URL
   * 
   * @param {string} urlOrPath - Storage path or full signed URL
   * @param {number} attachmentId - Attachment ID for fetching signed URL if needed
   * @returns {Promise<string>} - Full displayable URL
   */
  async getDisplayUrl(urlOrPath, attachmentId) {
    // If it's already a full URL, use it directly
    if (this.isFullUrl(urlOrPath)) {
      return urlOrPath
    }
    
    // Otherwise, fetch signed URL from backend
    if (attachmentId) {
      try {
        return await this.getDownloadUrl(attachmentId)
      } catch (error) {
        console.error('Failed to get display URL:', error)
        // Return original path as fallback
        return urlOrPath
      }
    }
    
    return urlOrPath
  },
}

export default attachmentService
