import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useRef, useMemo } from 'react'
import { workspaceService } from '../services/workspaceService'

/**
 * Returns the current user's role in the active workspace.
 * role: 'OWNER' | 'ADMIN' | 'MEMBER' | null
 *
 * Uses keepPreviousData so the role never flickers to null during
 * background refetches — prevents the invite section from vanishing.
 * 
 * OPTIMIZATION: Returns Redux role immediately without waiting for API
 * API call runs in background for freshness, but doesn't block UI
 */
export function useWorkspaceRole(workspaceId = null) {
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const activeId = workspaceId ?? currentWorkspace?.id

  // Persist last known role so it never resets to null during refetch
  const lastRoleRef = useRef(null)

  // OPTIMIZATION: Use Redux userRole immediately (from workspace list response)
  // This is always fresh because it was loaded with the workspace in listUserWorkspaces
  const reduxRole = currentWorkspace?.userRole ?? null
  if (reduxRole) lastRoleRef.current = reduxRole

  // Background query to verify/refresh role (but doesn't block the UI if Redis role is available)
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['my-role', activeId],
    queryFn: () => workspaceService.getMyRole(activeId),
    enabled: Boolean(activeId),
    staleTime: 15 * 60 * 1000,   // 15 min - role changes are rare
    gcTime: 30 * 60 * 1000,      // keep in cache for 30 min
    retry: 1,
    placeholderData: keepPreviousData,
  })
  
  // Extract role — prioritize Redux role for immediate rendering
  const freshRole = data?.role ?? null
  if (freshRole) lastRoleRef.current = freshRole
  
  // OPTIMIZATION: Use Redux role as primary source for immediate rendering
  // Only use API data if available, otherwise fall back to last known
  const role = reduxRole || freshRole || lastRoleRef.current

  // OPTIMIZATION: Memoize permissions to avoid recalculating on every render
  const permissions = useMemo(() => ({
    role,
    isLoading: isLoading && !reduxRole && !role, // only "loading" if NO role at all
    isOwner:        role === 'OWNER',
    isAdmin:        role === 'ADMIN',
    isAdminOrOwner: role === 'OWNER' || role === 'ADMIN',
    isMember:       role === 'MEMBER',
    canCreateProject:  role === 'OWNER' || role === 'ADMIN',
    canDeleteProject:  role === 'OWNER' || role === 'ADMIN',
    canManageMembers:  role === 'OWNER' || role === 'ADMIN',
    canPromoteMembers: role === 'OWNER',
    canDeleteWorkspace: role === 'OWNER',
    canManageProjects: role === 'OWNER' || role === 'ADMIN',
    canManageTasks: role === 'OWNER' || role === 'ADMIN',
    canManageCRM: role === 'OWNER' || role === 'ADMIN',
    canCreateInvitations: role === 'OWNER' || role === 'ADMIN',
    canManageLeadMagnets: role === 'OWNER' || role === 'ADMIN',
    canCreateLeadMagnets: role === 'OWNER' || role === 'ADMIN',
    canViewLeadMagnets: true,  // All members can view
    canManageEmailCampaigns: role === 'OWNER' || role === 'ADMIN',
    canViewEmailCampaigns: true,
  }), [role, reduxRole, isLoading])
  
  return permissions
}
