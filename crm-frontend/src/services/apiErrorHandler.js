/**
 * PHASE 7: API Error Handler
 * 
 * Centralized error handling for workspace API calls.
 * Automatically handles 403 errors when members are removed.
 */

import { memberRemovalService } from './memberRemovalService'

export const createApiErrorHandler = (queryClient, workspaceId) => {
  return (error) => {
    // PHASE 7: Handle member removal errors (403 Forbidden)
    if (memberRemovalService.handleAccessDenied(error, queryClient, workspaceId)) {
      // Error was handled - member was removed from workspace
      // Queries have been invalidated automatically
      return {
        handled: true,
        reason: 'Member was removed from workspace',
        error
      }
    }

    // Return error for component to handle
    return {
      handled: false,
      error
    }
  }
}

/**
 * Wrap mutation error handler with member removal detection
 */
export const wrapMutationError = (originalOnError, queryClient, workspaceId) => {
  return (error) => {
    const result = memberRemovalService.handleAccessDenied(error, queryClient, workspaceId)
    
    if (!result) {
      // Error wasn't member removal - call original handler
      originalOnError?.(error)
    }
  }
}

export default createApiErrorHandler
