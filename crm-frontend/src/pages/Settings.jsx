import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiUser, FiLock, FiBell, FiUpload, FiTrash2, FiSave, FiMail, FiPhone, FiMapPin,
  FiLink, FiGlobe, FiGithub, FiLinkedin, FiClock, FiCode,
} from 'react-icons/fi'
import { authService } from '../services/authService'
import { updateUser } from '../store/slices/authSlice'
import { useAuth } from '../hooks/useAuth'
import UserAvatar from '../components/common/UserAvatar'
import { useThemeContext } from '../contexts/ThemeContext'

// Claymorphism Card Component
const ClayCard = ({ children, className = '', icon: Icon, title }) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return (
    <div
      className={`rounded-3xl border transition-all shadow-lg hover:shadow-xl overflow-hidden ${className}`}
      style={{
        background: isDark
          ? '#1E293B'
          : '#FFFFFF',
        borderColor: isDark
          ? 'rgba(99, 102, 241, 0.2)'
          : 'rgba(200, 210, 230, 0.4)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 8px 24px rgba(200, 210, 230, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {title && (
        <div
          className="px-6 py-4 border-b flex items-center gap-3"
          style={{
            borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(200, 210, 230, 0.3)',
            backgroundColor: isDark ? 'rgba(30, 58, 138, 0.2)' : 'rgba(100, 180, 255, 0.08)',
          }}
        >
          {Icon && <Icon size={20} style={{ color: isDark ? '#60A5FA' : '#3B82F6' }} />}
          <h3 className="font-bold text-base" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

// Field Component
const Field = ({ label, hint, children }) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return (
    <div>
      <label className="block text-sm font-semibold mb-3" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>{label}</label>
      {children}
      {hint && <p className="mt-2 text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>{hint}</p>}
    </div>
  )
}

// Input Component with Claymorphism
const Input = ({ className = '', ...props }) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return (
    <input
      className={`w-full rounded-2xl border px-4 py-3 text-sm transition-all font-medium ${className}`}
      style={{
        background: isDark
          ? 'rgba(15, 23, 42, 0.5)'
          : 'rgba(248, 250, 252, 0.9)',
        borderColor: isDark
          ? 'rgba(99, 102, 241, 0.25)'
          : 'rgba(200, 210, 230, 0.5)',
        color: isDark ? '#F8FAFC' : '#0F172A',
        boxShadow: isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.2), 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
      onFocus={(e) => {
        e.target.style.background = isDark
          ? 'rgba(30, 41, 59, 0.6)'
          : 'rgba(255, 255, 255, 0.95)'
        e.target.style.borderColor = isDark
          ? 'rgba(99, 102, 241, 0.5)'
          : 'rgba(100, 180, 255, 0.5)'
        e.target.style.boxShadow = isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 12px rgba(99, 102, 241, 0.2)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.3), 0 0 12px rgba(100, 180, 255, 0.2)'
      }}
      onBlur={(e) => {
        e.target.style.background = isDark
          ? 'rgba(15, 23, 42, 0.5)'
          : 'rgba(248, 250, 252, 0.9)'
        e.target.style.borderColor = isDark
          ? 'rgba(99, 102, 241, 0.25)'
          : 'rgba(200, 210, 230, 0.5)'
        e.target.style.boxShadow = isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.2), 0 1px 0 rgba(255, 255, 255, 0.9)'
      }}
      {...props}
    />
  )
}

// Textarea Component with Claymorphism
const Textarea = ({ className = '', ...props }) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return (
    <textarea
      rows={3}
      className={`w-full rounded-2xl border px-4 py-3 text-sm transition-all resize-none font-medium ${className}`}
      style={{
        background: isDark
          ? 'rgba(15, 23, 42, 0.5)'
          : 'rgba(248, 250, 252, 0.9)',
        borderColor: isDark
          ? 'rgba(99, 102, 241, 0.25)'
          : 'rgba(200, 210, 230, 0.5)',
        color: isDark ? '#F8FAFC' : '#0F172A',
        boxShadow: isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.2), 0 1px 0 rgba(255, 255, 255, 0.9)',
      }}
      onFocus={(e) => {
        e.target.style.background = isDark
          ? 'rgba(30, 41, 59, 0.6)'
          : 'rgba(255, 255, 255, 0.95)'
        e.target.style.borderColor = isDark
          ? 'rgba(99, 102, 241, 0.5)'
          : 'rgba(100, 180, 255, 0.5)'
        e.target.style.boxShadow = isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 12px rgba(99, 102, 241, 0.2)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.3), 0 0 12px rgba(100, 180, 255, 0.2)'
      }}
      onBlur={(e) => {
        e.target.style.background = isDark
          ? 'rgba(15, 23, 42, 0.5)'
          : 'rgba(248, 250, 252, 0.9)'
        e.target.style.borderColor = isDark
          ? 'rgba(99, 102, 241, 0.25)'
          : 'rgba(200, 210, 230, 0.5)'
        e.target.style.boxShadow = isDark
          ? 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)'
          : 'inset 0 1px 2px rgba(200, 210, 230, 0.2), 0 1px 0 rgba(255, 255, 255, 0.9)'
      }}
      {...props}
    />
  )
}

// Save Button with Claymorphism
const SaveBtn = ({ loading, label = 'Save changes' }) => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-50"
      style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}
    >
      <FiSave size={16} />
      {loading ? 'Saving…' : label}
    </button>
  )
}

// Profile Tab with Card-based Layout
const ProfileTab = ({ user }) => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    fullName:          user?.fullName          ?? '',
    firstName:         user?.firstName         ?? '',
    lastName:          user?.lastName          ?? '',
    displayName:       user?.displayName       ?? '',
    bio:               user?.bio               ?? '',
    designation:       user?.designation       ?? '',
    department:        user?.department        ?? '',
    phoneNumber:       user?.phoneNumber       ?? '',
    location:          user?.location          ?? '',
    website:           user?.website           ?? '',
    linkedinUrl:       user?.linkedinUrl       ?? '',
    githubUrl:         user?.githubUrl         ?? '',
    timezone:          user?.timezone          ?? '',
    preferredLanguage: user?.preferredLanguage ?? '',
  })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const updateMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (res) => {
      const updated = res?.data ?? res
      dispatch(updateUser(updated))
      queryClient.invalidateQueries(['profile'])
      toast.success('Profile saved')
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to save'),
  })

  const avatarMutation = useMutation({
    mutationFn: (url) => authService.updateAvatar(url),
    onSuccess: (res) => {
      const updated = res?.data ?? res
      dispatch(updateUser(updated))
      queryClient.invalidateQueries(['profile'])
      toast.success('Photo updated')
    },
    onError: () => toast.error('Failed to update photo'),
  })

  const removeAvatarMutation = useMutation({
    mutationFn: () => authService.removeAvatar(),
    onSuccess: (res) => {
      const updated = res?.data ?? res
      dispatch(updateUser(updated))
      queryClient.invalidateQueries(['profile'])
      toast.success('Photo removed')
    },
    onError: () => toast.error('Failed to remove photo'),
  })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max file size is 2 MB'); return }
    try {
      setUploading(true)
      const dataUrl = await authService.uploadImageToCloudinary(file)
      avatarMutation.mutate(dataUrl)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const previewUser = { ...user, ...form }

  return (
    <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form) }} className="space-y-6">
      {/* Avatar Card */}
      <ClayCard icon={FiUser} title="Profile Photo" className="col-span-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <UserAvatar user={previewUser} size="xl" />
          <div className="space-y-3 flex-1">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || avatarMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl transition-all disabled:opacity-50 border"
              style={{
                background: isDark ? 'rgba(30, 58, 138, 0.2)' : 'rgba(100, 180, 255, 0.1)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(100, 180, 255, 0.4)',
                color: isDark ? '#60A5FA' : '#3B82F6',
                boxShadow: isDark
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              <FiUpload size={16} />
              {uploading || avatarMutation.isPending ? 'Uploading…' : user?.profileImageUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {user?.profileImageUrl && (
              <button
                type="button"
                onClick={() => removeAvatarMutation.mutate()}
                disabled={removeAvatarMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl transition-all disabled:opacity-50"
                style={{ color: '#EF4444' }}
              >
                <FiTrash2 size={16} />
                Remove photo
              </button>
            )}
            <p className="text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>JPG, PNG or GIF · Max 2 MB</p>
          </div>
        </div>
      </ClayCard>

      {/* Basic Info Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClayCard icon={FiMail} title="Email">
          <Field label="Email address">
            <Input type="email" value={user?.email || ''} disabled />
          </Field>
          <p className="mt-2 text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Email cannot be changed</p>
        </ClayCard>

        <ClayCard icon={FiUser} title="Display Name">
          <Field label="Display name">
            <Input value={form.displayName} onChange={set('displayName')} placeholder="e.g. arjun or @arjun" />
          </Field>
          <p className="mt-2 text-xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Short name or handle</p>
        </ClayCard>
      </div>

      {/* Names Card */}
      <ClayCard icon={FiUser} title="Names">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name">
            <Input value={form.firstName} onChange={set('firstName')} placeholder="First name" />
          </Field>
          <Field label="Last name">
            <Input value={form.lastName} onChange={set('lastName')} placeholder="Last name" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Full name (display in app)">
            <Input value={form.fullName} onChange={set('fullName')} placeholder="Full name" required />
          </Field>
        </div>
      </ClayCard>

      {/* Bio Card */}
      <ClayCard icon={FiCode} title="Bio">
        <Field label="About you" hint="Tell your team a bit about yourself">
          <Textarea value={form.bio} onChange={set('bio')} placeholder="Write your bio here..." />
        </Field>
      </ClayCard>

      {/* Work Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClayCard title="Job Title">
          <Field label="Designation">
            <Input value={form.designation} onChange={set('designation')} placeholder="e.g. Senior Engineer" />
          </Field>
        </ClayCard>

        <ClayCard title="Department">
          <Field label="Department">
            <Input value={form.department} onChange={set('department')} placeholder="e.g. Engineering" />
          </Field>
        </ClayCard>
      </div>

      {/* Contact Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClayCard icon={FiPhone} title="Phone">
          <Field label="Phone number">
            <Input value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+1 (555) 000-0000" />
          </Field>
        </ClayCard>

        <ClayCard icon={FiMapPin} title="Location">
          <Field label="Location">
            <Input value={form.location} onChange={set('location')} placeholder="e.g. Mumbai, India" />
          </Field>
        </ClayCard>
      </div>

      {/* Links Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClayCard icon={FiGlobe} title="Website">
          <Field label="Website">
            <Input value={form.website} onChange={set('website')} placeholder="https://yoursite.com" />
          </Field>
        </ClayCard>

        <ClayCard icon={FiLinkedin} title="LinkedIn">
          <Field label="LinkedIn URL">
            <Input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/username" />
          </Field>
        </ClayCard>
      </div>

      {/* GitHub Card */}
      <ClayCard icon={FiGithub} title="GitHub">
        <Field label="GitHub URL">
          <Input value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/username" />
        </Field>
      </ClayCard>

      {/* Preferences Cards - 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClayCard icon={FiClock} title="Timezone">
          <Field label="Timezone">
            <Input value={form.timezone} onChange={set('timezone')} placeholder="e.g. Asia/Kolkata" />
          </Field>
        </ClayCard>

        <ClayCard icon={FiCode} title="Language">
          <Field label="Preferred language">
            <Input value={form.preferredLanguage} onChange={set('preferredLanguage')} placeholder="e.g. English" />
          </Field>
        </ClayCard>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <SaveBtn loading={updateMutation.isPending} />
      </div>
    </form>
  )
}

// Notifications Tab
const NotificationsTab = () => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const [prefs, setPrefs] = useState({
    taskAssigned:   true,
    taskCompleted:  true,
    mentions:       true,
    chatMessages:   false,
    weeklyDigest:   true,
  })
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }))

  const items = [
    { key: 'taskAssigned',  label: 'Task assigned to me',      desc: 'When a task is assigned or reassigned to you' },
    { key: 'taskCompleted', label: 'Task completed',           desc: 'When someone completes a task in your projects' },
    { key: 'mentions',      label: 'Mentions & comments',      desc: 'When someone @mentions you in a comment' },
    { key: 'chatMessages',  label: 'Chat messages',            desc: 'Real-time chat notifications' },
    { key: 'weeklyDigest',  label: 'Weekly activity digest',   desc: 'Summary of your team activity every Monday' },
  ]

  return (
    <div className="space-y-4">
      {items.map(({ key, label, desc }) => (
        <ClayCard key={key} icon={FiBell} title={label}>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: isDark ? '#CBD5E1' : '#64748B' }}>{desc}</p>
            <button
              type="button"
              onClick={() => toggle(key)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-all focus:outline-none"
              style={{
                background: prefs[key]
                  ? 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)'
                  : isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(200, 210, 230, 0.5)',
              }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform"
                style={{
                  transform: prefs[key] ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
        </ClayCard>
      ))}
    </div>
  )
}

// Security Tab
const SecurityTab = () => {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: (data) => authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Password changed')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to change password'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.newPassword.length < 8) { toast.error('Minimum 8 characters'); return }
    mutation.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ClayCard icon={FiLock} title="Password" className="col-span-1">
        <div className="space-y-4">
          <Field label="Current password">
            <Input type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Enter current password" required />
          </Field>
          <Field label="New password" hint="Minimum 8 characters">
            <Input type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="New password" required />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Confirm new password" required />
          </Field>
        </div>
      </ClayCard>

      <div className="flex justify-end pt-4">
        <SaveBtn loading={mutation.isPending} label="Update password" />
      </div>
    </form>
  )
}

// Main Settings Component
const Settings = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const content = {
    profile:       <ProfileTab user={user} />,
    notifications: <NotificationsTab />,
    security:      <SecurityTab />,
  }

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: FiUser  },
    { id: 'notifications', label: 'Notifications',  icon: FiBell  },
    { id: 'security',      label: 'Security',       icon: FiLock  },
  ]

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{
        backgroundColor: '#FFFFFF'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black" style={{ color: '#0F172A' }}>Settings</h1>
          <p className="mt-2 text-base" style={{ color: '#64748B' }}>Manage your profile, notifications, and security preferences</p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-3 mb-10 flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all border"
              style={{
                background: tab === id
                  ? 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)'
                  : '#F1F5F9',
                color: tab === id ? '#FFFFFF' : '#0F172A',
                borderColor: tab === id ? '#3B82F6' : '#D1D5DB',
                boxShadow: tab === id
                  ? '0 8px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : '0 2px 8px rgba(200, 210, 230, 0.2)',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {content[tab]}
        </div>
      </div>
    </div>
  )
}

export default Settings
