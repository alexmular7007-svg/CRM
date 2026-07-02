import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { FiMail, FiUser } from 'react-icons/fi'
import { registerSchema, calculatePasswordStrength } from '../../schemas/authSchemas'
import { useAuth } from '../../hooks/useAuth'
import FormInput from '../../components/auth/FormInput'
import PasswordInput from '../../components/auth/PasswordInput'
import SocialAuthButtons from '../../components/auth/SocialAuthButtons'

const EnhancedRegister = () => {
  const { register: registerUser, isRegistering } = useAuth()
  const [passwordStrength, setPasswordStrength] = useState(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  })

  const password = watch('password')

  // Update strength whenever password changes
  useState(() => {
    if (password) setPasswordStrength(calculatePasswordStrength(password))
    else setPasswordStrength(null)
  }, [password])

  const onSubmit = ({ confirmPassword, acceptTerms, ...data }) => {
    registerUser(data)  // Do NOT send role - it's assigned by backend
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E6EDF3] mb-1">
          Create your account
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#8B949E]">
          14-day free trial · No credit card required.
        </p>
      </div>

      {/* Social buttons */}
      <SocialAuthButtons mode="sign up" />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          label="Full name"
          type="text"
          placeholder="Enter your full name"
          icon={FiUser}
          error={errors.fullName?.message}
          autoComplete="name"
          {...register('fullName')}
        />

        <FormInput
          label="Work email"
          type="email"
          placeholder="Enter your email address"
          icon={FiMail}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Create a strong password"
          showStrength
          strength={passwordStrength}
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password', {
            onChange: e => setPasswordStrength(calculatePasswordStrength(e.target.value))
          })}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 dark:border-[#30363D] accent-violet-600 flex-shrink-0"
              {...register('acceptTerms')}
            />
            <span className="text-[13px] text-gray-600 dark:text-[#8B949E] leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-violet-600 dark:text-violet-400 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</a>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-[12px] text-red-600 dark:text-[#F85149]">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isRegistering}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium
            bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6]
            text-white rounded-md
            border border-[#7C3AED]/50
            transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? (
            <><Loader2 size={15} className="animate-spin" /> Creating account…</>
          ) : (
            <>Create account <ArrowRight size={15} /></>
          )}
        </button>
      </form>

      {/* Sign-in link */}
      <p className="text-center text-[13px] text-gray-500 dark:text-[#8B949E]">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default EnhancedRegister
