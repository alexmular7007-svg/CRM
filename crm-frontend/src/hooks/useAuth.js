import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../store/slices/authSlice'
import { clearWorkspace } from '../store/slices/workspaceSlice'
import { websocketService } from '../services/websocketService'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, loading, error, token } = useSelector((state) => state.auth)

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      dispatch(loginStart())
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      dispatch(clearWorkspace())  // clear any stale workspace from a previous user
      websocketService.connect()
      toast.success('Login successful!')
      
      // Check if there's a pending invitation - read from current window location
      const currentParams = new URLSearchParams(window.location.search)
      const invitationToken = currentParams.get('invitationToken')
      console.log('🔍 DEBUG loginMutation.onSuccess:')
      console.log('  window.location.search:', window.location.search)
      console.log('  currentParams:', Object.fromEntries(currentParams))
      console.log('  invitationToken:', invitationToken)
      console.log('  data.token exists:', !!data.token)
      
      if (invitationToken && data.token) {
        console.log('✅ Calling acceptInvitationAfterLogin with token:', invitationToken.substring(0, 20) + '...')
        // Auto-accept the invitation after login
        acceptInvitationAfterLogin(invitationToken, data.token)
      } else {
        console.log('❌ Skipping invitation acceptance - invitationToken:', !!invitationToken, 'data.token:', !!data.token)
        navigate('/dashboard')
      }
    },
    onError: (error) => {
      dispatch(loginFailure(error.message || 'Login failed'))
      toast.error(error.message || 'Login failed')
    },
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      dispatch(clearWorkspace())  // clear any stale workspace from a previous user
      websocketService.connect()
      toast.success('Registration successful!')
      
      // Check if there's a pending invitation - read from current window location
      const currentParams = new URLSearchParams(window.location.search)
      const invitationToken = currentParams.get('invitationToken')
      console.log('🔍 DEBUG registerMutation.onSuccess:')
      console.log('  window.location.search:', window.location.search)
      console.log('  invitationToken:', invitationToken)
      console.log('  data.token exists:', !!data.token)
      
      if (invitationToken && data.token) {
        console.log('✅ Calling acceptInvitationAfterLogin with token:', invitationToken.substring(0, 20) + '...')
        // Auto-accept the invitation after registration
        acceptInvitationAfterLogin(invitationToken, data.token)
      } else {
        console.log('❌ Skipping invitation acceptance - invitationToken:', !!invitationToken, 'data.token:', !!data.token)
        navigate('/dashboard')
      }
    },
    onError: (error) => {
      dispatch(loginFailure(error.message || 'Registration failed'))
      toast.error(error.message || 'Registration failed')
    },
  })

  const acceptInvitationAfterLogin = async (invitationToken, jwtToken) => {
    try {
      const apiBase = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api`
      const endpoint = `${apiBase}/workspaces/invitations/accept/${invitationToken}`
      
      console.log('🚀 acceptInvitationAfterLogin starting...')
      console.log('  endpoint:', endpoint)
      console.log('  token:', jwtToken.substring(0, 30) + '...')
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        console.error('❌ API Error response:', body)
        throw new Error(body?.message || `HTTP ${response.status}`)
      }

      const body = await response.json()
      console.log('✅ API Success response:', body)
      
      const workspaceData = body?.data?.workspace ?? body?.workspace

      toast.success('Invitation accepted!')
      
      // Invalidate workspace cache to ensure new workspace appears
      if (window.__queryClient) {
        console.log('💾 Invalidating workspace cache...')
        window.__queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      } else {
        console.warn('⚠️ No __queryClient available for cache invalidation')
      }

      // Redirect to workspaces list (will include newly joined workspace)
      console.log('🔄 Navigating to /workspaces...')
      navigate('/workspaces', { replace: true })
    } catch (err) {
      console.error('❌ Failed to auto-accept invitation:', err)
      toast.error('Invitation accepted but failed to navigate. Redirecting to dashboard...')
      navigate('/dashboard', { replace: true })
    }
  }

  const logout = () => {
    websocketService.disconnect()
    dispatch(logoutAction())       // clears auth + localStorage (token, user, currentWorkspace, currentProject)
    dispatch(clearWorkspace())     // resets Redux workspace state to null
    toast.success('Logged out successfully')
    navigate('/')
  }

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}
