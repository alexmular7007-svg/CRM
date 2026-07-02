/**
 * PHASE 7: Member Removal Service
 * 
 * Centralized service for handling member removal across the application.
 * Ensures consistent auto-refresh behavior when members are removed from workspace.
 */

export const memberRemovalService = {
  /**
   * Trigger auto-refresh for removed member
   * Dispatches custom event that components can listen to
   */
  triggerAutoRefresh: (workspaceId, removedUserId) => {
    // Dispatch custom event for components listening to member removal
    window.dispatchEvent(
      new CustomEvent('memberRemoved', {
        detail: {
          workspaceId,
          removedUserId,
          timestamp: new Date().toISOString(),
        }
      })
    )
  },

  /**
   * Handle member removal with automatic query invalidation
   * Call this after successfully removing a member
   */
  onMemberRemovalSuccess: (queryClient, workspaceId, removedUserId) => {
    // PHASE 7: Invalidate all affected queries
    const queriesToInvalidate = [
      ['workspaceMembers', workspaceId],
      ['workspaceMembers'],
      ['taskAssignees', workspaceId],
      ['projectMembers', workspaceId],
      ['leadAssignees', workspaceId],
      ['chatParticipants', workspaceId],
      ['tasks', workspaceId],
      ['projects', workspaceId],
      ['leads', workspaceId],
    ]

    // Invalidate each query
    queriesToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key })
    })

    // Dispatch event for listening components
    memberRemovalService.triggerAutoRefresh(workspaceId, removedUserId)
  },

  /**
   * Handle 403 Forbidden response when accessing workspace after removal
   * Automatically refetches data if member was removed
   */
  handleAccessDenied: (error, queryClient, workspaceId) => {
    if (error?.response?.status === 403) {
      const message = error?.response?.data?.message || ''
      
      // Check if error is due to member removal
      if (message.includes('removed') || 
          message.includes('not an active member') ||
          message.includes('access to this')) {
        
        // Invalidate workspace queries
        queryClient.invalidateQueries({
          queryKey: ['workspaceMembers', workspaceId]
        })
        
        return true // Handled
      }
    }
    return false // Not handled
  },

  /**
   * Create mutation callbacks for workspace member removal
   * Use this to wrap your removeMember mutation
   */
  createRemovalMutationCallbacks: (queryClient, workspaceId) => ({
    onSuccess: (data, variables) => {
      memberRemovalService.onMemberRemovalSuccess(
        queryClient,
        workspaceId,
        variables.userId
      )
    },
    onError: (error) => {
      // Let component handle error
      throw error
    }
  }),

  /**
   * Listen to member removal events
   * Returns unsubscribe function
   */
  listenToMemberRemoval: (callback) => {
    const handleRemoval = (event) => {
      callback(event.detail)
    }

    window.addEventListener('memberRemoved', handleRemoval)

    // Return unsubscribe function
    return () => {
      window.removeEventListener('memberRemoved', handleRemoval)
    }
  }
}

export default memberRemovalService
