import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiUsers, FiMail, FiLock, FiSettings, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { workspaceService } from '../services/workspaceService'
import { invitationService } from '../services/invitationService'
import { RoleGuard } from '../components/common/RoleGuard'
import Spinner from '../components/common/Spinner'
import MembersTab from '../components/workspace/MembersTab'

const WorkspaceSettings = () => {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useSelector((state) => state.workspace)

  const [activeTab, setActiveTab] = useState('members')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')

  // Fetch workspace details
  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId,
  })

  // Fetch workspace members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  })

  const members = membersData?.data ?? membersData ?? []

  // Fetch pending invitations
  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ['pendingInvitations', workspaceId],
    queryFn: () => invitationService.getPendingInvitations(workspaceId),
    enabled: !!workspaceId && activeTab === 'invitations',
  })

  const pendingInvitations = invitationsData?.data ?? invitationsData ?? []

  // Send invitation mutation (replaces addMember)
  const sendInvitationMutation = useMutation({
    mutationFn: () => invitationService.sendInvitation(workspaceId, inviteEmail, inviteRole),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', workspaceId])
      queryClient.invalidateQueries(['pendingInvitations', workspaceId])
      setInviteEmail('')
      setInviteRole('MEMBER')
      toast.success('Invitation sent successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation')
    },
  })

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (email) => invitationService.resendInvitation(workspaceId, email),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingInvitations', workspaceId])
      toast.success('Invitation resent successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation')
    },
  })

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: (email) => invitationService.revokeInvitation(workspaceId, email),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingInvitations', workspaceId])
      toast.success('Invitation revoked successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation')
    },
  })

  const handleSendInvitation = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    if (!inviteRole) {
      toast.error('Please select a role')
      return
    }
    sendInvitationMutation.mutate()
  }

  const handleResendInvitation = (email) => {
    resendInvitationMutation.mutate(email)
  }

  const handleRevokeInvitation = (email) => {
    if (window.confirm('Are you sure you want to revoke this invitation?')) {
      revokeInvitationMutation.mutate(email)
    }
  }

  const workspaceName = workspace?.name || currentWorkspace?.name || 'Workspace'

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/workspaces/${workspaceId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-textPrimary)' }}>
            {workspaceName} Settings
          </h1>
          <p className="mt-1" style={{ color: 'var(--theme-textSecondary)' }}>
            Manage your workspace members, invitations, and permissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FiUsers size={18} />
              <span>Members</span>
            </div>
          </button>

          <RoleGuard workspaceId={workspaceId} requireRole="ADMIN">
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiMail size={18} />
                <span>Invitations</span>
              </div>
            </button>
          </RoleGuard>

          <RoleGuard workspaceId={workspaceId} requireRole="OWNER">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiLock size={18} />
                <span>Roles & Permissions</span>
              </div>
            </button>
          </RoleGuard>

          <RoleGuard workspaceId={workspaceId} requireRole="OWNER">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiSettings size={18} />
                <span>General</span>
              </div>
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Members Tab */}
        {activeTab === 'members' && <MembersTab workspaceId={workspaceId} />}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <RoleGuard workspaceId={workspaceId} requireRole="ADMIN">
            <div className="space-y-6">
              {/* Send Invitation Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Send Gmail Invitation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Invite someone via email. If they already have an account, they'll be added directly. 
                  If not, they'll receive an invitation email.
                </p>
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gmail Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={sendInvitationMutation.isPending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </motion.button>
                </form>
              </div>

              {/* Pending Invitations List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pending Invitations
                </h3>
                {invitationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : pendingInvitations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No pending invitations
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                              {invitation.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {invitation.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  invitation.role === 'ADMIN'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {invitation.role}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Expires: {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => handleResendInvitation(invitation.email)}
                            disabled={resendInvitationMutation.isPending}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Resend
                          </motion.button>
                          <motion.button
                            onClick={() => handleRevokeInvitation(invitation.email)}
                            disabled={revokeInvitationMutation.isPending}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Revoke
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </RoleGuard>
        )}

        {/* Roles & Permissions Tab */}
        {activeTab === 'roles' && (
          <RoleGuard workspaceId={workspaceId} requireRole="OWNER">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    role: 'OWNER',
                    icon: FiShield,
                    color: 'purple',
                    permissions: [
                      'Full workspace control',
                      'Manage members & roles',
                      'Delete workspace',
                      'Access all projects',
                      'Manage invitations',
                    ],
                  },
                  {
                    role: 'ADMIN',
                    icon: FiShield,
                    color: 'blue',
                    permissions: [
                      'Manage members',
                      'Send invitations',
                      'Create projects',
                      'Access all projects',
                      'Manage tasks',
                    ],
                  },
                  {
                    role: 'MEMBER',
                    icon: FiUsers,
                    color: 'gray',
                    permissions: [
                      'View assigned projects',
                      'View tasks',
                      'Participate in chat',
                      'View analytics',
                      'Cannot manage members',
                    ],
                  },
                ].map(({ role, icon: Icon, color, permissions }) => (
                  <div
                    key={role}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-${color}-200 dark:border-${color}-800`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon size={24} className={`text-${color}-600 dark:text-${color}-400`} />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{role}</h4>
                    </div>
                    <ul className="space-y-2">
                      {permissions.map((permission, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className={`text-${color}-600 dark:text-${color}-400 mt-1`}>✓</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </RoleGuard>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <RoleGuard workspaceId={workspaceId} requireRole="OWNER">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Workspace Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Workspace Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{workspace?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Workspace Owner
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workspace?.owner?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Members
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{members.length}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Created
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workspace?.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RoleGuard>
        )}
      </motion.div>
    </div>
  )
}

export default WorkspaceSettings
