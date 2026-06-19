import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, ChevronRight, Zap } from 'lucide-react'
import { searchProductKnowledge } from '../../services/landingPageKnowledgeService'

const DEMO_CONVERSATIONS = [
  {
    visitor: "What does TaskFlow AI do?",
    ai: "TaskFlow AI combines Project Management, CRM Pipeline, Team Chat, Analytics, and AI Insights into one unified workspace. It's designed to help teams collaborate seamlessly and make data-driven decisions. Perfect for SaaS teams, consulting firms, sales teams, and agencies!"
  },
  {
    visitor: "Can I manage sales leads?",
    ai: "Absolutely! Our CRM Pipeline lets you track leads from prospect to closed deal. Visualize your entire sales funnel with 5+ customizable stages, manage negotiations, and leverage AI insights to close deals faster. Example: Track 240 leads through qualification, proposals, and negotiations."
  },
  {
    visitor: "Can I collaborate with my team?",
    ai: "Yes! Real-time chat, task assignments, @mentions, typing indicators, read receipts, and message reactions are all built-in. Your team stays synchronized with online status and project-specific channels. Perfect for distributed teams!"
  },
  {
    visitor: "How does AI help?",
    ai: "Our Grok-powered AI analyzes your team's patterns to provide smart task prioritization, deadline predictions, workspace health scoring (0-100%), bottleneck detection, workload analysis, and productivity recommendations to help you work smarter."
  },
  {
    visitor: "Can I track project progress?",
    ai: "Of course! The analytics dashboard shows real-time project progress, team performance metrics, productivity analytics, lead tracking, burndown charts, and forecasting. Make informed decisions with real-time data and custom reports."
  },
  {
    visitor: "What AI insights can I get?",
    ai: "You'll get workspace health scores, overdue task detection, project delay predictions, team member workload analysis, risk predictions for projects and deals, and smart task prioritization based on urgency and complexity."
  },
  {
    visitor: "Is it secure?",
    ai: "Yes! Enterprise-grade security with role-based access control (Owner/Admin/Member), SSO & SAML support, end-to-end encryption, audit logs, GDPR compliance, and regular security audits. Perfect for enterprises."
  },
]

const QUICK_ACTIONS = [
  { label: 'Features', section: '#features', icon: '✨' },
  { label: 'CRM Pipeline', section: '#crm', icon: '💼' },
  { label: 'Workflow', section: '#workflow', icon: '📊' },
  { label: 'Pricing', section: '#pricing', icon: '💰' },
  { label: 'AI Insights', section: '#ai', icon: '🧠' },
  { label: 'Tech Stack', section: '#tech', icon: '⚙️' },
]

export default function FloatingCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentConvIndex, setCurrentConvIndex] = useState(0)
  const messagesEndRef = useRef(null)

  // Show greeting after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const scrollToSection = (section) => {
    const element = document.querySelector(section)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  const handleSendMessage = async (text = userInput) => {
    if (!text.trim()) return

    // Add user message
    const newMessages = [...messages, {
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    }]
    setMessages(newMessages)
    setUserInput('')

    // Search product knowledge base
    const knowledgeResults = searchProductKnowledge(text)
    let aiResponse = ''

    // If we found relevant knowledge, use it
    if (knowledgeResults.length > 0) {
      const knowledge = knowledgeResults[0]
      
      if (knowledge.type === 'feature') {
        const feature = knowledge.data
        aiResponse = `${feature.title} - ${feature.description}\n\nKey benefits:\n${feature.keyBenefits.slice(0, 3).map((b) => `• ${b}`).join('\n')}`
      } else if (knowledge.type === 'pricing') {
        aiResponse = `Great question! We have three plans:\n• Free: Perfect for trying out\n• Professional ($12/mo): For growing teams with AI features\n• Enterprise: Custom pricing for large organizations\n\nAll include 14-day free trial with no credit card required.`
      } else if (knowledge.type === 'workflow') {
        aiResponse = `Our workflow is simple:\n1. Create workspace\n2. Organize into projects\n3. Manage tasks with AI\n4. Collaborate in real-time\n5. Track & improve with analytics\n\nGet started in minutes!`
      } else if (knowledge.type === 'useCase') {
        aiResponse = `${knowledge.data.title}: ${knowledge.data.description}`
      }
    } else {
      // Fallback to demo conversations matching
      const lowerText = text.toLowerCase()

      if (lowerText.includes('what') && lowerText.includes('taskflow')) {
        aiResponse = DEMO_CONVERSATIONS[0].ai
      } else if (lowerText.includes('lead') || lowerText.includes('crm') || lowerText.includes('sales')) {
        aiResponse = DEMO_CONVERSATIONS[1].ai
      } else if (lowerText.includes('team') || lowerText.includes('collaborate') || lowerText.includes('chat')) {
        aiResponse = DEMO_CONVERSATIONS[2].ai
      } else if (lowerText.includes('ai') || lowerText.includes('intelligence') || lowerText.includes('smart')) {
        aiResponse = DEMO_CONVERSATIONS[3].ai
      } else if (lowerText.includes('project') || lowerText.includes('progress') || lowerText.includes('track')) {
        aiResponse = DEMO_CONVERSATIONS[4].ai
      } else if (lowerText.includes('insight') || lowerText.includes('health') || lowerText.includes('workspace')) {
        aiResponse = DEMO_CONVERSATIONS[5].ai
      } else if (lowerText.includes('secure') || lowerText.includes('security') || lowerText.includes('sso')) {
        aiResponse = DEMO_CONVERSATIONS[6].ai
      } else {
        aiResponse = "That's a great question! I'm here to help you understand TaskFlow AI. Feel free to ask about our features, pricing, CRM capabilities, project management, analytics, AI insights, security, or anything else. What would you like to know?"
      }
    }

    // Simulate typing with realistic delay based on response length
    setIsTyping(true)
    const typingDelay = Math.min(800 + (aiResponse.length / 10), 2000)
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        text: aiResponse,
        timestamp: new Date()
      }])
      setIsTyping(false)
    }, typingDelay)
  }

  const handleQuickAction = (text) => {
    handleSendMessage(text)
  }

  const handleDemoClick = () => {
    if (currentConvIndex < DEMO_CONVERSATIONS.length) {
      const conv = DEMO_CONVERSATIONS[currentConvIndex]
      handleSendMessage(conv.visitor)
      setCurrentConvIndex(prev => prev + 1)
    }
  }

  const handleOpenChat = () => {
    setIsOpen(true)
    setShowGreeting(false)
    // Clear demo messages and show fresh chat
    if (messages.length === 0) {
      setMessages([{
        type: 'ai',
        text: "👋 Hi! I'm TaskFlow AI Copilot, powered by Grok AI. I can help you understand how TaskFlow AI transforms team collaboration, sales management, and project execution. Ask me about our features, pricing, CRM workflow, AI insights, or anything else!",
        timestamp: new Date()
      }])
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="fixed bottom-6 right-6 z-40"
      >
        {/* Pulsing Ring Animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#4F46E5]/30"
          animate={{ scale: [1, 1.3], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main Button */}
        <motion.button
          onClick={handleOpenChat}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#4F46E5] to-indigo-600 shadow-lg hover:shadow-xl shadow-indigo-500/30 flex items-center justify-center group"
        >
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4F46E5] to-indigo-600 opacity-0 group-hover:opacity-20 blur-lg"
            animate={{ scale: [1, 1.1] }}
          />

          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative z-10"
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Greeting Bubble */}
      <AnimatePresence>
        {showGreeting && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 15 }}
            className="fixed bottom-28 right-6 z-40 max-w-xs"
          >
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl p-5">
              {/* Close button */}
              <button
                onClick={() => setShowGreeting(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>

              <div className="pr-6">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Hi, I'm TaskFlow AI Copilot
                </h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4 leading-relaxed">
                  Powered by Grok AI. Ask me about project management, CRM pipelines, team collaboration, analytics, pricing, or anything else about TaskFlow AI!
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleDemoClick}
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap size={12} />
                    See Demo
                  </button>
                  <button
                    onClick={handleOpenChat}
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    Ask AI
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '560px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-white text-sm">TaskFlow AI Copilot</h2>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <p className="text-indigo-100 text-xs">
                  Powered by Grok AI. Ask about projects, CRM, analytics, AI insights, pricing & more
                </p>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#4F46E5]/10 flex items-center justify-center mb-3">
                      <Sparkles size={24} className="text-[#4F46E5]" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 max-w-xs">
                      Powered by Grok AI. Ask me anything about TaskFlow AI - features, pricing, workflow, CRM, analytics, AI insights, or get started!
                    </p>
                  </motion.div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                        msg.type === 'user'
                          ? 'bg-[#4F46E5] text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg rounded-bl-none px-4 py-3 flex gap-1">
                      <motion.span
                        className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-gray-400 dark:bg-zinc-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions / Lead Capture */}
            {messages.length > 0 && messages.length % 3 === 2 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30"
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-3 uppercase tracking-wide">Learn More</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.slice(0, 6).map((action) => (
                    <motion.button
                      key={action.label}
                      onClick={() => scrollToSection(action.section)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-xs font-medium px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-sm">{action.icon}</span>
                      <span className="line-clamp-1">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Lead Capture CTAs */}
            {messages.length > 5 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 space-y-2 bg-gradient-to-br from-[#4F46E5]/5 to-indigo-600/5 dark:from-indigo-950/20 dark:to-indigo-900/20"
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-3">Ready to transform your team?</p>
                <div className="space-y-2">
                  <motion.a
                    href="/register"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="block w-full text-xs font-medium px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white hover:from-[#4338CA] hover:to-indigo-700 transition-all text-center shadow-md shadow-indigo-500/20"
                  >
                    🚀 Get Started Free (14-day trial)
                  </motion.a>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.a
                      href="/register"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-center"
                    >
                      📅 Book Demo
                    </motion.a>
                    <motion.a
                      href="#pricing"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const el = document.querySelector('#pricing')
                        el?.scrollIntoView({ behavior: 'smooth' })
                        setIsOpen(false)
                      }}
                      className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-center"
                    >
                      💰 View Pricing
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#4F46E5] dark:focus:border-indigo-500 transition-colors"
                  disabled={isTyping}
                />
                <motion.button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping || !userInput.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2.5 rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
