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
   * Get a signed download URL for an attachment
   * 
   * PHASE 4 + PHASE 8: Security - backend validates permissions before generating URL
   * 
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<string>} - Signed download URL valid for 7 days
   */
  async getDownloadUrl(attachmentId) {
    try {
      const response = await api.get(`/attachments/${attachmentId}/url`)
      return response.data.data.downloadUrl
    } catch (error) {
      console.error('Failed to get download URL:', error)
      throw error
    }
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
}

export default attachmentService
