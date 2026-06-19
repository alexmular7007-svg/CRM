import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MessageCircle, CheckCircle, Heart, ArrowRight } from 'lucide-react'

const CHAT_MESSAGES = [
  {
    author: 'Arjun',
    role: 'Tech Lead',
    avatar: 'AJ',
    color: 'bg-indigo-500',
    message: 'API integration completed! Ready for review.',
    timestamp: '10:24 AM',
    isAuthor: true,
  },
  {
    author: 'Aryan',
    role: 'DevOps',
    avatar: 'AR',
    color: 'bg-blue-500',
    message: 'Deployment is in progress. ETA 15 minutes.',
    timestamp: '10:25 AM',
    isAuthor: false,
    read: true,
  },
  {
    author: 'TaskFlow AI',
    role: 'AI Assistant',
    avatar: 'TF',
    color: 'bg-purple-500',
    message: '✨ Project completion probability increased to 92%',
    timestamp: '10:26 AM',
    isAuthor: false,
    isAI: true,
    read: true,
  },
]

const ChatPreview = ({ isInView }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={isInView ? { opacity: 1, scale: 1 } : {}}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-xl"
  >
    {/* Chat header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">#sprint-12-deployment</div>
        <div className="text-xs text-gray-500 dark:text-zinc-400">3 online • 2 typing</div>
      </div>
      <div className="flex -space-x-2">
        {['AJ', 'AR', 'SK'].map((init) => (
          <div
            key={init}
            className={`w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-xs font-bold ${
              init === 'AJ' ? 'bg-indigo-500' : init === 'AR' ? 'bg-blue-500' : 'bg-emerald-500'
            }`}
          >
            {init}
          </div>
        ))}
      </div>
    </div>

    {/* Messages */}
    <div className="p-6 space-y-4 bg-white dark:bg-[#09090B]" style={{ height: '320px', overflowY: 'auto' }}>
      {CHAT_MESSAGES.map((msg, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          className={`flex gap-3 ${msg.isAuthor ? 'flex-row-reverse' : ''}`}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${msg.color} border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-xs font-bold`}>
            {msg.avatar}
          </div>

          {/* Message bubble */}
          <div className={`flex-1 flex flex-col ${msg.isAuthor ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{msg.author}</span>
              {msg.isAI && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40">
                  <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
                  AI
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-zinc-600">{msg.timestamp}</span>
            </div>
            
            <div
              className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed max-w-xs ${
                msg.isAuthor
                  ? 'bg-indigo-500 text-white'
                  : msg.isAI
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-gray-900 dark:text-white border border-purple-200 dark:border-purple-800'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
              }`}
            >
              {msg.message}
            </div>

            {/* Message status */}
            <div className="flex items-center gap-1 mt-1">
              {msg.isAuthor && (
                <>
                  <CheckCircle size={12} className="text-gray-400 dark:text-zinc-600" />
                  <span className="text-[10px] text-gray-400 dark:text-zinc-600">Delivered</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Input area */}
    <div className="border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          disabled
        />
        <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors">
          <MessageCircle size={18} />
        </button>
      </div>
    </div>
  </motion.div>
)

const TeamCollaborationSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-32 px-4 sm:px-6 bg-white dark:bg-[#09090B] border-t border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" ref={ref}>
          
          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 border border-sky-500/25 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8">
              Real-Time Chat
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-8">
              Work Together In Real Time
            </h2>

            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-12">
              Keep your team synchronized with direct messages, group chats, and project channels. Share updates instantly, see who's online, and collaborate without friction.
            </p>

            {/* Collaboration features */}
            <div className="space-y-6 mb-12">
              {[
                {
                  icon: MessageCircle,
                  title: 'Direct Messages',
                  description: 'One-on-one conversations with team members',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/40',
                },
                {
                  icon: Heart,
                  title: 'Reactions & Threads',
                  description: 'Express feedback and keep conversations organized',
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-50 dark:bg-rose-950/40',
                },
              ].map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={feature.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <motion.a
              href="#pricing"
              whileHover={{ x: 4 }}
              className="inline-flex items-center gap-2 text-[#4F46E5] dark:text-indigo-400 font-semibold hover:gap-3 transition-all"
            >
              Explore collaboration features
              <ArrowRight size={16} />
            </motion.a>
          </motion.div>

          {/* RIGHT: Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <ChatPreview isInView={isInView} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default TeamCollaborationSection
