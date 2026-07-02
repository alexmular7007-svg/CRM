import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../store/slices/authSlice'
import { clearWorkspace } from '../store/slices/workspaceSlice'
import { websocketService } from '../services/websocketService'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading, error } = useSelector((state) => state.auth)

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
      navigate('/dashboard')
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
      navigate('/dashboard')
    },
    onError: (error) => {
      dispatch(loginFailure(error.message || 'Registration failed'))
      toast.error(error.message || 'Registration failed')
    },
  })

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
