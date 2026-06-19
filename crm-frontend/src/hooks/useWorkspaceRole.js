import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useRef } from 'react'
import { workspaceService } from '../services/workspaceService'

/**
 * Returns the current user's role in the active workspace.
 * role: 'OWNER' | 'ADMIN' | 'MEMBER' | null
 *
 * Uses keepPreviousData so the role never flickers to null during
 * background refetches — prevents the invite section from vanishing.
 */
export function useWorkspaceRole(workspaceId = null) {
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const activeId = workspaceId ?? currentWorkspace?.id

  // Persist last known role so it never resets to null during refetch
  const lastRoleRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-role', activeId],
    queryFn: () => workspaceService.getMyRole(activeId),
    enabled: Boolean(activeId),
    staleTime: 10 * 60 * 1000,   // 10 min — role changes are rare
    gcTime: 15 * 60 * 1000,      // keep in cache for 15 min
    retry: 1,
    placeholderData: keepPreviousData, // never flash null during background refetch
  })

  // Extract role — fall back to last known role while refetching
  const freshRole = data?.role ?? null
  if (freshRole) lastRoleRef.current = freshRole
  const role = freshRole ?? lastRoleRef.current

  return {
    role,
    isLoading: isLoading && !role, // only "loading" if we have no role at all
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
  }
}
