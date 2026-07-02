import { motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const AuthCard = ({ isLogin, onToggle }) => {
  return (
    <div style={{ perspective: '1200px' }} className="w-full">
      {/* Container with fixed aspect ratio to prevent layout shift */}
      <div className="relative w-full" style={{ minHeight: 'auto' }}>
        {/* FRONT SIDE - LOGIN */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={isLogin ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="w-full bg-white dark:bg-[#1A1A1D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {isLogin && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm onSwitchToRegister={() => onToggle(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BACK SIDE - REGISTER */}
        <motion.div
          initial={{ rotateY: -180, opacity: 0 }}
          animate={isLogin ? { rotateY: -180, opacity: 0 } : { rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="w-full bg-white dark:bg-[#1A1A1D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onSwitchToLogin={() => onToggle(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthCard
