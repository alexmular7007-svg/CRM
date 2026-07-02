import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Spinner from '../components/common/Spinner'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`

/**
 * Invitation Acceptance Page
 * URL: /invitations/accept?token={INVITATION_TOKEN}
 * 
 * Flow:
 * 1. Extract invitation token from URL
 * 2. If user is logged in: Accept invitation directly
 * 3. If user is not logged in: Redirect to login with token preserved
 * 4. After acceptance: Redirect to workspace dashboard
 */
const InvitationAccept = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { token: authToken } = useSelector((state) => state.auth)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const invitationToken = params.get('token')

    if (!invitationToken) {
      toast.error('No invitation token provided.')
      navigate('/dashboard', { replace: true })
      return
    }

    // If user is not logged in, redirect to login with token preserved
    if (!authToken) {
      navigate(`/login?invitationToken=${invitationToken}`, { replace: true })
      return
    }

    // User is logged in - accept the invitation
    acceptInvitation(invitationToken, authToken)
  }, [authToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const acceptInvitation = async (invitationToken, jwtToken) => {
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/invitations/accept/${invitationToken}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || `HTTP ${response.status}`)
      }

      const body = await response.json()
      const workspace = body?.data?.workspace ?? body?.data ?? body

      toast.success('Invitation accepted! Joining workspace...')

      // Redirect to the workspace dashboard
      if (workspace?.id) {
        navigate(`/workspaces/${workspace.id}`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err)
      toast.error(err.message || 'Failed to accept invitation. Please try again.')
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-[#8B949E]">
          Processing your invitation, please wait…
        </p>
      </div>
    </div>
  )
}

export default InvitationAccept
