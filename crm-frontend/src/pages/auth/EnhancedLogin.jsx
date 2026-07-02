import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginSchema } from '../../schemas/authSchemas'
import { useAuth } from '../../hooks/useAuth'
import FormInput from '../../components/auth/FormInput'
import PasswordInput from '../../components/auth/PasswordInput'
import SocialAuthButtons from '../../components/auth/SocialAuthButtons'
import { FiMail } from 'react-icons/fi'

const EnhancedLogin = () => {
  const { login, isLoggingIn } = useAuth()
  const [rememberMe, setRememberMe] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E6EDF3] mb-1">
          Sign in to TaskFlow
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#8B949E]">
          Welcome back — enter your details below.
        </p>
      </div>

      {/* Demo Credentials Hint */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1.5">📝 Demo Credentials:</p>
        <div className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5">
          <p><strong>Email:</strong> test1@example.com</p>
          <p><strong>Password:</strong> password123</p>
          <p className="text-blue-700 dark:text-blue-400 text-[11px] mt-1">Or: test2@example.com, admin@example.com</p>
        </div>
      </div>

      {/* Social buttons */}
      <SocialAuthButtons mode="sign in" />

      {/* Email/password form */}
      <form onSubmit={handleSubmit(d => login(d))} className="space-y-4">
        <FormInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={FiMail}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />

        {/* Remember + forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 dark:border-[#30363D] accent-violet-600"
              {...register('rememberMe')}
            />
            <span className="text-[13px] text-gray-600 dark:text-[#8B949E]">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-[13px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
            bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6]
            text-white rounded-md
            border border-[#7C3AED]/50
            transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <><Loader2 size={15} className="animate-spin" /> Signing in…</>
          ) : (
            <>Sign in <ArrowRight size={15} /></>
          )}
        </button>
      </form>

      {/* Sign-up link */}
      <p className="text-center text-[13px] text-gray-500 dark:text-[#8B949E]">
        Don't have an account?{' '}
        <Link to="/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors">
          Create one
        </Link>
      </p>

      <p className="text-center text-[11px] text-gray-400 dark:text-[#484F58]">
        By signing in you agree to our{' '}
        <a href="#" className="underline hover:text-gray-600 dark:hover:text-[#6E7681]">Terms</a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-gray-600 dark:hover:text-[#6E7681]">Privacy Policy</a>.
      </p>
    </div>
  )
}

export default EnhancedLogin
