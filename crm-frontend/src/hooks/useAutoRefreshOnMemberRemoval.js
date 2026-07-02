import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * PHASE 7: Auto-refresh hook for workspace member removal
 * 
 * Automatically refetches all workspace-related queries when a member is removed.
 * This ensures that removed members immediately disappear from:
 * - Task assignee dropdowns
 * - Project member selectors
 * - CRM lead assignee lists
 * - Chat participant lists
 * - Any other member-dependent UI
 * 
 * Usage:
 * const queryClient = useQueryClient()
 * useAutoRefreshOnMemberRemoval(workspaceId, queryClient)
 */
export const useAutoRefreshOnMemberRemoval = (workspaceId, queryClient) => {
  useEffect(() => {
    if (!workspaceId || !queryClient) return

    // Listen for member removal events via custom events
    // This allows components to trigger auto-refresh across the app
    const handleMemberRemoved = () => {
      // PHASE 7: Invalidate all workspace-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          // Get query key if it's an array or object
          const key = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey]
          
          // Invalidate if query contains workspaceId
          return key.includes(workspaceId) || 
                 key.includes('workspaceMembers') ||
                 key.includes('taskAssignees') ||
                 key.includes('projectMembers') ||
                 key.includes('leadAssignees') ||
                 key.includes('chatParticipants')
        }
      })
    }

    // Listen for custom event
    window.addEventListener('memberRemoved', handleMemberRemoved)
    return () => window.removeEventListener('memberRemoved', handleMemberRemoved)
  }, [workspaceId, queryClient])
}

/**
 * PHASE 7: Handle API 403 errors for removed members
 * 
 * When a member is removed, any attempt to access workspace resources
 * should get a 403 Forbidden response. This utility handles that gracefully.
 */
export const handleRemovedMemberError = (error, queryClient, workspaceId) => {
  if (error?.response?.status === 403 && 
      error?.response?.data?.message?.includes('removed')) {
    // Auto-refresh all workspace queries
    if (queryClient && workspaceId) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey]
          return key.includes(workspaceId)
        }
      })
    }
    return true // Indicate error was handled
  }
  return false // Error not related to member removal
}

export default useAutoRefreshOnMemberRemoval
