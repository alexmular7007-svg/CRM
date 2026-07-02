import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`

const OAuth2Callback = () => {
  const [params] = useSearchParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = params.get('token')
    const invitationToken = params.get('invitationToken')
    const error = params.get('error')

    if (error) {
      toast.error('Social login failed. Please try again.')
      navigate('/login', { replace: true })
      return
    }

    if (!token) {
      toast.error('No authentication token received.')
      navigate('/login', { replace: true })
      return
    }

    // Step 1: Load user profile
    fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((body) => {
        const user = body?.data ?? body

        if (!user?.id) throw new Error('Invalid user data received')

        // Step 2: Save auth state to Redux
        dispatch(loginSuccess({ token, user }))
        toast.success(`Welcome, ${user.displayName || user.fullName || 'User'}!`)

        // Step 3: If invitationToken present, auto-accept invitation
        if (invitationToken) {
          acceptInvitationAndRedirect(token, invitationToken)
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch((err) => {
        console.error('OAuth2 profile load failed:', err)
        toast.error('Failed to load your profile. Please try signing in again.')
        navigate('/login', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Accept pending invitation and redirect to workspace
   */
  const acceptInvitationAndRedirect = async (jwtToken, invToken) => {
    try {
      console.log('Auto-accepting invitation with token:', invToken.substring(0, 10) + '...')
      
      const response = await fetch(
        `${API_BASE}/workspaces/invitations/accept/${invToken}`,
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
        console.error('Invitation acceptance failed:', body)
        // If acceptance fails, still go to dashboard
        navigate('/dashboard', { replace: true })
        return
      }

      const body = await response.json()
      const workspace = body?.data?.workspace ?? body?.data ?? body

      console.log('✓ Invitation accepted successfully')
      toast.success('Invitation accepted! Redirecting to workspace...')

      // Redirect to the workspace dashboard
      if (workspace?.id) {
        navigate(`/workspaces/${workspace.id}`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Failed to auto-accept invitation:', err)
      // If something goes wrong, still redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-[#8B949E]">
          Completing sign-in, please wait…
        </p>
      </div>
    </div>
  )
}

export default OAuth2Callback
