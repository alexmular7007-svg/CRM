import { useState } from 'react'

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080'

/* Official Google SVG mark */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

/* GitHub mark */
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const SocialAuthButtons = ({ mode = 'login' }) => {
  const [loading, setLoading] = useState(null)

  const handleOAuth = (provider) => {
    setLoading(provider)
    
    // Preserve invitationToken if present in URL (for pending invitations)
    const params = new URLSearchParams(window.location.search)
    const invitationToken = params.get('invitationToken')
    
    let oauthUrl = `${BACKEND}/oauth2/authorization/${provider}`
    if (invitationToken) {
      oauthUrl += `?invitationToken=${encodeURIComponent(invitationToken)}`
    }
    
    window.location.href = oauthUrl
  }

  return (
    <div className="space-y-2.5">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium
          bg-white dark:bg-[#21262D]
          border border-gray-300 dark:border-[#30363D]
          text-gray-700 dark:text-[#E6EDF3]
          rounded-md
          hover:bg-gray-50 dark:hover:bg-[#30363D]
          active:scale-[0.99]
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        {loading === 'google' ? (
          <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : <GoogleIcon />}
        Continue with Google
      </button>

      {/* GitHub */}
      <button
        type="button"
        onClick={() => handleOAuth('github')}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium
          bg-[#24292F] hover:bg-[#32383F] active:bg-[#24292F]
          dark:bg-[#21262D] dark:hover:bg-[#30363D]
          text-white
          border border-[#1B1F24] dark:border-[#30363D]
          rounded-md
          active:scale-[0.99]
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        {loading === 'github' ? (
          <svg className="animate-spin h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : <GitHubIcon />}
        Continue with GitHub
      </button>

      {/* Divider */}
      <div className="relative pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-[#30363D]" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-[#161B22] text-[11px] text-gray-400 dark:text-[#6E7681] uppercase tracking-wider">
            or {mode} with email
          </span>
        </div>
      </div>
    </div>
  )
}

export default SocialAuthButtons
