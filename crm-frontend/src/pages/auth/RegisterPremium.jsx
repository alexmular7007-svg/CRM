import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, LayoutDashboard, MessageSquare, Users, Sparkles, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const RegisterPremium = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false
  })
  const [passwordMatch, setPasswordMatch] = useState(true)
  const { register, isRegistering } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false)
      return
    }

    setPasswordMatch(true)
    const { confirmPassword, termsAgreed, ...registerData } = formData
    register(registerData)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      setPasswordMatch(true)
    }
  }

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/oauth2/callback`
    const scope = 'openid profile email'
    const responseType = 'code'
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`
    window.location.href = googleAuthUrl
  }

  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/oauth2/callback`
    const scope = 'user:email'
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    window.location.href = githubAuthUrl
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT PANEL - DARK THEME WITH BENEFITS */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <motion.div {...fadeIn} className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">✓</div>
            <span className="text-xl font-bold tracking-tight">TaskFlow AI</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            {...fadeIn}
            className="text-4xl lg:text-5xl font-black leading-tight mb-6 space-y-3"
          >
            <span className="block">Manage Projects,</span>
            <span className="block">Teams and Clients</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">from one workspace.</span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            {...fadeIn}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-10 leading-relaxed"
          >
            The all-in-one platform for engineering and operations teams — tasks, chat, CRM, and AI insights in a single view.
          </motion.p>

          {/* Benefits List */}
          <motion.div 
            {...fadeIn}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {[
              { icon: LayoutDashboard, text: 'Task Management', color: 'text-blue-400' },
              { icon: MessageSquare, text: 'Real-Time Chat', color: 'text-emerald-400' },
              { icon: Users, text: 'CRM Pipeline', color: 'text-amber-400' },
              { icon: Sparkles, text: 'AI Insights', color: 'text-indigo-400' }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm hover:bg-slate-800/60 transition-all"
              >
                <div className={`p-2.5 rounded-lg bg-slate-900/50 ${benefit.color}`}>
                  <benefit.icon size={18} />
                </div>
                <span className="font-semibold text-slate-200">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview at Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 mt-12 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl bg-slate-800/50 backdrop-blur-md"
        >
          <div className="h-8 bg-slate-900/80 border-b border-slate-600 flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          </div>
          <div className="p-4 grid grid-cols-3 gap-3 opacity-60">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-700/30 h-12 rounded-lg flex items-center p-2 gap-2">
                <Activity size={14} className="text-indigo-400 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2 w-12 bg-slate-600 rounded" />
                  <div className="h-1.5 w-8 bg-slate-600 rounded" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL - REGISTRATION FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <motion.div 
            {...fadeIn}
            className="mb-10"
          >
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Create an account</h2>
            <p className="text-gray-600 text-lg">Join thousands of teams using TaskFlow</p>
          </motion.div>

          {/* OAuth Buttons */}
          <motion.div 
            {...fadeIn}
            transition={{ delay: 0.1 }}
            className="space-y-3 mb-8"
          >
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl font-semibold text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <button
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-gray-700 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Sign up with GitHub</span>
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div 
            {...fadeIn}
            transition={{ delay: 0.15 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="px-4 bg-white text-gray-400">Or sign up with email</span>
            </div>
          </motion.div>

          {/* Email Form */}
          <motion.form 
            {...fadeIn}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all shadow-sm bg-white text-gray-900 placeholder-gray-500 ${
                    !passwordMatch 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  required
                />
              </div>
              {!passwordMatch && (
                <p className="text-red-500 text-sm mt-2 font-medium">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                name="termsAgreed"
                type="checkbox"
                required
                checked={formData.termsAgreed}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer mt-1"
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-gray-700 cursor-pointer">
                I agree to the{' '}
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">Terms</a>
                {' '}and{' '}
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 px-4 border-0 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.form>

          <motion.p 
            {...fadeIn}
            transition={{ delay: 0.25 }}
            className="mt-8 text-center text-sm text-gray-600"
          >
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPremium
