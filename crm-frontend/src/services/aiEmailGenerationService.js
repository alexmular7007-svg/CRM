import api from './api'

/**
 * AIEmailGenerationService - Phase 11.3: AI Email Generation API Client
 *
 * Service layer for AI email generation endpoints.
 * Integrates with Phase 11.2 backend API.
 *
 * Endpoints:
 * - POST /api/emails/generate - Generate email from inputs
 * - POST /api/emails/regenerate - Regenerate with same inputs
 * - GET /api/emails/tones - List available tones
 * - GET /api/emails/health - Health check
 *
 * Error Handling:
 * - Catches provider unavailable (502/503)
 * - Catches rate limit errors (429)
 * - Catches timeout errors
 * - Parses AI response errors
 * - Returns structured error objects
 */

const unwrap = (response) => response?.data ?? response

export const aiEmailGenerationService = {
  /**
   * Generate email with AI
   *
   * @param {Object} request - Generation request
   * @param {string} request.purpose - Campaign purpose
   * @param {string} request.targetAudience - Target audience
   * @param {string} request.productService - Product/service description
   * @param {string} request.tone - Email tone (Professional, Friendly, etc.)
   * @param {string} [request.offer] - Special offer (optional)
   * @param {string} [request.keyPoints] - Key points (optional)
   * @param {string} request.ctaText - CTA button text
   * @param {string} request.ctaUrl - CTA button URL
   * @param {string} [request.language] - Email language (optional, default: English)
   * @param {string} [request.companyName] - Company name (optional)
   *
   * @returns {Promise<Object>} Response object:
   *   - subject: string
   *   - bodyHtml: string (HTML-formatted email)
   *   - bodyPlainText: string (plain text version)
   *   - ctaText: string (CTA button text)
   *   - ctaUrl: string (CTA button URL)
   *   - success: boolean
   *   - error: string (if success=false)
   *   - model: string (e.g., "llama-3.3-70b-versatile")
   *   - generatedAt: ISO timestamp
   *
   * @throws {Object} Error object with structure:
   *   {
   *     message: string,
   *     status: number (HTTP status),
   *     code: string (error code like 'RATE_LIMIT', 'TIMEOUT', 'SERVICE_UNAVAILABLE'),
   *     details: string (detailed error message)
   *   }
   */
  async generateEmail(request) {
    try {
      console.log('🌐 API_REQUEST_START: POST /emails/generate', request)
      const response = await api.post('/emails/generate', request)
      console.log('🌐 API_RESPONSE_RECEIVED:', { status: 200, body: response })
      const unwrappedResponse = unwrap(response)
      console.log('🌐 API_RESPONSE_UNWRAPPED:', unwrappedResponse)
      return unwrappedResponse
    } catch (error) {
      console.log('🌐 API_REQUEST_ERROR:', error)
      const parsedError = parseError(error, 'email generation')
      console.log('🌐 API_ERROR_PARSED:', parsedError)
      throw parsedError
    }
  },

  /**
   * Regenerate email with same inputs
   *
   * Same request/response format as generateEmail.
   * Useful for:
   * - Getting alternative versions
   * - Fixing failed generation attempts
   * - User-triggered refresh
   *
   * @param {Object} request - Same format as generateEmail
   * @returns {Promise<Object>} Response object (same as generateEmail)
   * @throws {Object} Error object
   */
  async regenerateEmail(request) {
    try {
      const response = await api.post('/emails/regenerate', request)
      return unwrap(response)
    } catch (error) {
      throw parseError(error, 'email regeneration')
    }
  },

  /**
   * Get available email tones
   *
   * @returns {Promise<Array>} Array of tone strings:
   *   ["Professional", "Friendly", "Urgent", "Casual", "Formal", "Persuasive", "Humorous"]
   */
  async getTones() {
    try {
      const response = await api.get('/emails/tones')
      return unwrap(response)
    } catch (error) {
      console.error('Error fetching tones:', error)
      // Return fallback tones if request fails
      return ['Professional', 'Friendly', 'Urgent', 'Casual', 'Formal', 'Persuasive', 'Humorous']
    }
  },

  /**
   * Health check for email generation service
   *
   * @returns {Promise<string>} Status message
   */
  async health() {
    try {
      const response = await api.get('/emails/health')
      return unwrap(response)
    } catch (error) {
      throw parseError(error, 'health check')
    }
  },
}

/**
 * Parse error response and return structured error object
 *
 * @param {Error|Object} error - Error from Axios
 * @param {string} context - Context for error message (e.g., "email generation")
 * @returns {Object} Structured error object
 *
 * Error Codes:
 * - RATE_LIMIT: AI provider rate limit (429)
 * - SERVICE_UNAVAILABLE: AI provider unavailable (502/503)
 * - TIMEOUT: Request timeout
 * - VALIDATION_ERROR: Invalid request parameters (400)
 * - SERVER_ERROR: Server error (500)
 * - NETWORK_ERROR: Network error
 * - UNKNOWN_ERROR: Unknown error
 */
function parseError(error, context) {
  const errorResponse = {
    message: `Failed to complete ${context}`,
    status: error?.response?.status || 0,
    code: 'UNKNOWN_ERROR',
    details: error?.message || 'Unknown error',
  }

  // Handle Axios error structure
  if (error?.response) {
    const { status, data } = error.response

    // Extract AI provider error message from response
    const aiError = data?.data?.error || data?.message || error.message

    if (status === 429) {
      errorResponse.code = 'RATE_LIMIT'
      errorResponse.message = 'Rate limit exceeded. Please wait a moment and try again.'
      errorResponse.details = 'AI provider rate limit reached. Try again in a few moments.'
    } else if (status === 502) {
      errorResponse.code = 'SERVICE_UNAVAILABLE'
      errorResponse.message = 'AI service temporarily unavailable. Please try again in a moment.'
      errorResponse.details = 'AI provider returned Bad Gateway error'
    } else if (status === 503) {
      errorResponse.code = 'SERVICE_UNAVAILABLE'
      errorResponse.message = 'AI service is currently overloaded. Please try again shortly.'
      errorResponse.details = 'AI provider returned Service Unavailable error'
    } else if (status === 400) {
      errorResponse.code = 'VALIDATION_ERROR'
      errorResponse.message = 'Invalid input provided. Please check your entries.'
      errorResponse.details = aiError || 'Request validation failed'
    } else if (status === 500) {
      errorResponse.code = 'SERVER_ERROR'
      errorResponse.message = 'Server error during generation. Please try again.'
      errorResponse.details = aiError || 'Internal server error'
    } else if (status === 408 || error.message?.includes('timeout')) {
      errorResponse.code = 'TIMEOUT'
      errorResponse.message = 'Generation took too long. Please try again.'
      errorResponse.details = 'Request timeout - AI generation took longer than expected'
    } else {
      errorResponse.message = aiError || `Error during ${context}`
      errorResponse.details = aiError || error.message
    }
  } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    errorResponse.code = 'TIMEOUT'
    errorResponse.message = 'Generation took too long. Please try again.'
    errorResponse.details = 'Request timeout - AI generation took longer than expected'
  } else if (!error?.response) {
    // Network error
    errorResponse.code = 'NETWORK_ERROR'
    errorResponse.message = 'Network error. Please check your connection and try again.'
    errorResponse.details = error?.message || 'Network error occurred'
  }

  return errorResponse
}

export default aiEmailGenerationService
