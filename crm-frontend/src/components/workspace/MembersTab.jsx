import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FiSearch, FiUserPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import { workspaceService } from '../../services/workspaceService'
import { memberRemovalService } from '../../services/memberRemovalService'
import Spinner from '../common/Spinner'

const MembersTab = ({ workspaceId }) => {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')

  // Search all registered users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: () => userService.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  const users = searchResults?.content ?? searchResults ?? []

  // Fetch current workspace members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  })

  const members = membersData?.content ?? membersData ?? []
  const memberIds = new Set(members.map(m => m.userId))

  // Add existing user mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ email, role }) => workspaceService.addMember(workspaceId, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaceMembers', workspaceId])
      setSearchQuery('')
      toast.success('Member added successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member')
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => workspaceService.removeMember(workspaceId, userId),
    onSuccess: (data, variables) => {
      // PHASE 7: Use member removal service for auto-refresh
      memberRemovalService.onMemberRemovalSuccess(
        queryClient,
        workspaceId,
        variables
      )
      toast.success('Member removed successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    },
  })

  const handleAddMember = (user) => {
    addMemberMutation.mutate({ email: user.email, role: selectedRole })
  }

  const handleRemoveMember = (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(userId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Existing User
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Search for registered users and add them directly to this workspace. No email will be sent.
        </p>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mt-4">
            {searchLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No users found matching "{searchQuery}"
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => {
                  const isAlreadyMember = memberIds.has(user.id)
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.fullName || user.displayName || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      {isAlreadyMember ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-full">
                          Already Member
                        </span>
                      ) : (
                        <motion.button
                          onClick={() => handleAddMember(user)}
                          disabled={addMemberMutation.isPending}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <FiUserPlus size={16} />
                          <span>Add as {selectedRole}</span>
                        </motion.button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Members ({members.length})
          </h3>
        </div>
        
        {membersLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No members in this workspace
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {member.userProfileImageUrl ? (
                            <img
                              src={member.userProfileImageUrl}
                              alt={member.userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {member.userName?.charAt(0) || member.userEmail?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {member.userName || 'Unknown User'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {member.userEmail || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            member.role === 'OWNER'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                              : member.role === 'ADMIN'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {member.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removeMemberMutation.isPending}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MembersTab
