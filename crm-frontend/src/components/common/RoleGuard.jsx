import { useWorkspaceRole } from '../../hooks/useWorkspaceRole'

/**
 * RoleGuard Component
 * 
 * Conditionally renders children based on user's workspace role.
 * Prevents users from seeing UI for actions they don't have permission to perform.
 * 
 * Usage:
 * <RoleGuard workspaceId={workspaceId} requireRole="ADMIN">
 *   <button>Delete Workspace</button>
 * </RoleGuard>
 * 
 * @param {string} workspaceId - ID of the workspace to check role for
 * @param {string} requireRole - Role required ('OWNER', 'ADMIN', or 'MEMBER')
 * @param {ReactNode} children - Content to show if user has permission
 * @param {ReactNode} fallback - Content to show if user doesn't have permission (default: null)
 */
export const RoleGuard = ({
  workspaceId,
  requireRole,
  children,
  fallback = null,
}) => {
  const { role, isLoading } = useWorkspaceRole(workspaceId)

  // Show nothing while loading (use fallback if explicitly provided)
  if (isLoading) {
    return fallback
  }

  // Determine if user has access based on role hierarchy
  const hasAccess = {
    OWNER: role === 'OWNER',
    ADMIN: role === 'OWNER' || role === 'ADMIN',
    MEMBER: true, // All authenticated users are at least members
  }[requireRole] || false

  return hasAccess ? children : fallback
}

export default RoleGuard
