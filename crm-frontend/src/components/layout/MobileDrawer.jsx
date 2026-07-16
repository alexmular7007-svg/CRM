import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * MobileDrawer - Reusable bottom sheet/slide drawer for mobile
 * 
 * Props:
 * - isOpen: boolean - Whether drawer is open
 * - onClose: function - Called when drawer should close
 * - title: string - Optional header title
 * - children: ReactNode - Drawer content
 * - position: 'bottom' | 'left' | 'right' - Default 'bottom'
 * - maxHeight: string - Max height for bottom sheets (default '70vh')
 * - width: string - Width for left/right drawers (default 'w-64')
 * - isDismissible: boolean - Can swipe down to dismiss (bottom only)
 * - theme: object - Theme colors (optional)
 */
export default function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
  maxHeight = '70vh',
  width = 'w-64',
  isDismissible = true,
  theme = null,
}) {
  // Handle swipe down to dismiss (bottom sheet only)
  const handleSwipeDown = (event) => {
    if (isDismissible && position === 'bottom' && event.direction === 'down') {
      onClose()
    }
  }

  // Determine animation based on position
  const getAnimationVariants = () => {
    switch (position) {
      case 'left':
        return {
          initial: { x: '-100%' },
          animate: { x: 0 },
          exit: { x: '-100%' },
        }
      case 'right':
        return {
          initial: { x: '100%' },
          animate: { x: 0 },
          exit: { x: '100%' },
        }
      case 'bottom':
      default:
        return {
          initial: { y: '100%', opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: '100%', opacity: 0 },
        }
    }
  }

  const animationVariants = getAnimationVariants()

  // Position-specific classes
  const getDrawerClasses = () => {
    const baseClasses = 'fixed z-50 bg-white dark:bg-zinc-900 overflow-hidden'

    switch (position) {
      case 'left':
        return `${baseClasses} left-0 top-0 bottom-0 ${width} border-r border-gray-200 dark:border-zinc-800 flex flex-col`
      case 'right':
        return `${baseClasses} right-0 top-0 bottom-0 ${width} border-l border-gray-200 dark:border-zinc-800 flex flex-col`
      case 'bottom':
      default:
        return `${baseClasses} bottom-0 left-0 right-0 rounded-t-2xl border-t border-gray-200 dark:border-zinc-800 flex flex-col`
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            variants={animationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }}
            onDragEnd={handleSwipeDown}
            dragElastic={0.2}
            className={getDrawerClasses()}
            style={theme ? {
              backgroundColor: theme.colors?.surface || '#ffffff',
              borderColor: theme.colors?.border || '#e5e7eb',
            } : {}}
          >
            {/* Handle Bar (bottom sheet only) */}
            {position === 'bottom' && isDismissible && (
              <div className="flex justify-center pt-2.5 pb-3 border-b border-gray-200 dark:border-zinc-800">
                <div className="h-1 w-12 rounded-full bg-gray-300 dark:bg-zinc-600" />
              </div>
            )}

            {/* Header with title and close button */}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Close drawer"
                >
                  <X size={20} className="text-gray-600 dark:text-zinc-400" />
                </button>
              </div>
            )}

            {/* Content - Scrollable */}
            <div
              className="flex-1 overflow-y-auto"
              style={position === 'bottom' ? { maxHeight: `calc(${maxHeight} - 120px)` } : {}}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
