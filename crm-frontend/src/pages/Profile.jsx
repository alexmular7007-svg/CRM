import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FiMapPin, FiPhone, FiGlobe, FiLinkedin, FiGithub,
  FiEdit2, FiBriefcase, FiUsers, FiCheckSquare, FiTrendingUp,
} from 'react-icons/fi'
import UserAvatar from '../components/common/UserAvatar'
import api from '../services/api'

const unwrap = (r) => r?.data?.data ?? r?.data ?? r

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon size={16} className="text-white" />
    </div>
    <span className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</span>
  </div>
)

const InfoRow = ({ icon: Icon, label, value, href }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[13px] text-[#4F46E5] dark:text-indigo-400 hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-[13px] text-gray-800 dark:text-gray-200">{value}</p>
        )}
      </div>
    </div>
  )
}

const Profile = () => {
  const reduxUser = useSelector((s) => s.auth.user)

  // Fetch fresh profile from API (includes all extended fields)
  const { data: user = reduxUser } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me')
      return unwrap(res)
    },
    initialData: reduxUser,
    staleTime: 30_000,
  })

  // Activity stats
  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      try {
        // Call backend endpoint that doesn't require workspaceId
        // These endpoints should fetch user's overall stats without workspace filter
        const res = await api.get('/users/me/stats')
        return unwrap(res)
      } catch (error) {
        // Fallback if endpoint doesn't exist
        return {
          tasksTotal: 0,
          projectsTotal: 0,
        }
      }
    },
    staleTime: 60_000,
  })

  const displayName = user?.displayName || user?.fullName || 'Unknown User'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[#4F46E5]/10 via-[#4F46E5]/5 to-transparent dark:from-indigo-950/40 dark:to-transparent" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
            {/* Avatar */}
            <div className="ring-4 ring-white dark:ring-gray-800 rounded-full w-fit">
              <UserAvatar user={user} size="xl" />
            </div>

            <Link to="/settings">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700
                text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FiEdit2 size={14} />
                Edit profile
              </button>
            </Link>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
            {(user?.designation || user?.department) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {[user.designation, user.department].filter(Boolean).join(' · ')}
              </p>
            )}
            {user?.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 max-w-xl leading-relaxed">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left col — contact + links */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Contact
            </h2>
            <div className="space-y-3">
              <InfoRow icon={FiPhone}    label="Phone"    value={user?.phoneNumber} />
              <InfoRow icon={FiMapPin}   label="Location" value={user?.location} />
              <InfoRow icon={FiGlobe}    label="Website"  value={user?.website}    href={user?.website} />
              <InfoRow icon={FiLinkedin} label="LinkedIn" value={user?.linkedinUrl} href={user?.linkedinUrl} />
              <InfoRow icon={FiGithub}   label="GitHub"   value={user?.githubUrl}  href={user?.githubUrl} />
            </div>
            {!user?.phoneNumber && !user?.location && !user?.website && !user?.linkedinUrl && !user?.githubUrl && (
              <p className="text-xs text-gray-400 dark:text-gray-600 italic">No contact info added.</p>
            )}
          </div>

          {/* Role badge */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
              Role
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4F46E5]/10 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-xs font-semibold">
              <FiBriefcase size={11} />
              {user?.role || 'USER'}
            </span>
          </div>
        </div>

        {/* Right col — activity */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Activity summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat icon={FiCheckSquare} label="Tasks assigned"    value={stats?.tasksTotal}    color="bg-[#4F46E5]" />
              <Stat icon={FiTrendingUp}  label="Projects joined"   value={stats?.projectsTotal} color="bg-emerald-500" />
              <Stat icon={FiUsers}       label="Workspace member"  value={1}                    color="bg-sky-500" />
            </div>
          </div>

          {/* Member since */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h2 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
              Account
            </h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
              </div>
              {user?.createdAt && (
                <div className="flex justify-between">
                  <span>Member since</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {user?.timezone && (
                <div className="flex justify-between">
                  <span>Timezone</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.timezone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
