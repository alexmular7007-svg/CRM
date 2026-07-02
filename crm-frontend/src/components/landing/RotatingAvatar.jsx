import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Diverse business profile users with realistic styling
const BUSINESS_USERS = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Product Manager',
    gradient: 'from-blue-400 to-blue-600',
    textColor: 'text-white',
    initials: 'SC',
    bgPattern: 'radial-gradient(circle at 20% 80%, #3b82f6 0%, #1e40af 100%)',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Software Engineer',
    gradient: 'from-indigo-400 to-indigo-600',
    textColor: 'text-white',
    initials: 'MJ',
    bgPattern: 'radial-gradient(circle at 30% 70%, #818cf8 0%, #4338ca 100%)',
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'Designer',
    gradient: 'from-purple-400 to-purple-600',
    textColor: 'text-white',
    initials: 'PP',
    bgPattern: 'radial-gradient(circle at 40% 60%, #c084fc 0%, #7e22ce 100%)',
  },
  {
    id: 4,
    name: 'James Rodriguez',
    role: 'Sales Executive',
    gradient: 'from-rose-400 to-rose-600',
    textColor: 'text-white',
    initials: 'JR',
    bgPattern: 'radial-gradient(circle at 50% 50%, #fb7185 0%, #be185d 100%)',
  },
  {
    id: 5,
    name: 'Emma Thompson',
    role: 'Marketing Lead',
    gradient: 'from-amber-400 to-amber-600',
    textColor: 'text-white',
    initials: 'ET',
    bgPattern: 'radial-gradient(circle at 60% 40%, #fbbf24 0%, #d97706 100%)',
  },
  {
    id: 6,
    name: 'Aditya Singh',
    role: 'CEO',
    gradient: 'from-emerald-400 to-emerald-600',
    textColor: 'text-white',
    initials: 'AS',
    bgPattern: 'radial-gradient(circle at 70% 30%, #4ade80 0%, #16a34a 100%)',
  },
  {
    id: 7,
    name: 'Sofia Martinez',
    role: 'Data Analyst',
    gradient: 'from-cyan-400 to-cyan-600',
    textColor: 'text-white',
    initials: 'SM',
    bgPattern: 'radial-gradient(circle at 35% 65%, #06b6d4 0%, #0369a1 100%)',
  },
  {
    id: 8,
    name: 'Liam O\'Connor',
    role: 'DevOps Engineer',
    gradient: 'from-teal-400 to-teal-600',
    textColor: 'text-white',
    initials: 'LO',
    bgPattern: 'radial-gradient(circle at 45% 55%, #14b8a6 0%, #0d9488 100%)',
  },
]

// Create professional SVG avatar
const AvatarSVG = ({ user, size = 64 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="w-full h-full rounded-full">
      <defs>
        <style>
          {`
            @keyframes shimmer {
              0% { opacity: 0.8; }
              50% { opacity: 1; }
              100% { opacity: 0.8; }
            }
            .shimmer-effect {
              animation: shimmer 3s ease-in-out infinite;
            }
          `}
        </style>
      </defs>
      
      {/* Background gradient */}
      <circle cx="32" cy="32" r="32" fill="url(#userGradient)" />
      <defs>
        <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={user.id % 2 === 0 ? '#60a5fa' : '#8b5cf6'} />
          <stop offset="100%" stopColor={user.id % 2 === 0 ? '#1e40af' : '#6d28d9'} />
        </linearGradient>
      </defs>
      
      {/* Professional subtle pattern */}
      <circle cx="32" cy="20" r="12" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="32" cy="42" rx="16" ry="14" fill="rgba(255,255,255,0.2)" />
      
      {/* Text initials - professional style */}
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fill="white"
        fontSize="24"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {user.initials}
      </text>
      
      {/* Subtle border shine */}
      <circle cx="32" cy="32" r="31.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  )
}

export default function RotatingAvatar({ size = 'md', location = 'topbar' }) {
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  // Rotate users every 4-6 seconds with fade animation
  useEffect(() => {
    const randomDelay = 4000 + Math.random() * 2000 // 4-6 seconds
    const timer = setInterval(() => {
      setCurrentUserIndex((prev) => (prev + 1) % BUSINESS_USERS.length)
      setFadeKey((prev) => prev + 1)
    }, randomDelay)

    return () => clearInterval(timer)
  }, [])

  const currentUser = BUSINESS_USERS[currentUserIndex]

  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  const tailwindSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <motion.div
      key={`avatar-${fadeKey}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className={`${tailwindSize[size]} rounded-full flex-shrink-0 ring-2 ring-indigo-500/30`}
      title={`${currentUser.name} - ${currentUser.role}`}
    >
      <AvatarSVG user={currentUser} size={sizeMap[size]} />
    </motion.div>
  )
}

export { BUSINESS_USERS }
