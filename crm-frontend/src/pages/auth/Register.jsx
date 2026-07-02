import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/common/Spinner'

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const { register, isRegistering } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    const { confirmPassword, ...registerData } = formData
    register(registerData)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="card animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="input"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            placeholder="Enter your password (min 8 characters)"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="Confirm your password"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={isRegistering}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isRegistering ? (
            <>
              <Spinner size="sm" />
              <span>Creating account...</span>
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Login
        </Link>
      </div>
    </div>
  )
}

export default Register
