import { motion } from 'framer-motion'
import { MessageSquare, Bell, Eye, Zap } from 'lucide-react'

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true }
})

const CollaborationEducationSection = () => {
  return (
    <section className="relative py-24 px-4 sm:px-6 bg-white dark:bg-[#09090B] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <motion.div {...fadeInUp(0)}>
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-full mb-4">
                Team Collaboration
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Work together without switching tools
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Communicate instantly with team chat, share updates, assign tasks, and stay aligned without endless email chains. Everything happens in one unified workspace.
              </p>
            </div>

            {/* Collaboration features */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                  <MessageSquare size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Real-time Chat</h3>
                  <p className="text-gray-600">Direct messages and group channels for seamless team communication</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                  <Bell size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Smart Notifications</h3>
                  <p className="text-gray-600">Get alerted on mentions, assigned tasks, and deadline reminders</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                  <Eye size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Read Receipts</h3>
                  <p className="text-gray-600">Know when teammates see your messages and files</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100">
                  <Zap size={24} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Instant Presence</h3>
                  <p className="text-gray-600">See who's online, typing indicators, and activity status</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Chat visualization */}
          <motion.div {...fadeInUp(0.2)}>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
              {/* Chat window */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Chat header */}
                <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900"># project-launch</h3>
                    <p className="text-xs text-gray-500">8 members online</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {['AJ', 'SK', 'MK'].map((init, idx) => (
                      <motion.div
                        key={init}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        viewport={{ once: true }}
                        className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      >
                        {init}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Chat messages */}
                <div className="p-4 space-y-4 h-64 overflow-y-auto bg-white">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AJ</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Alex Johnson</div>
                      <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 mt-1">
                        🚀 Launch day is here! All systems ready. Let's ship!
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">SK</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Sara Kim</div>
                      <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700 mt-1">
                        QA passed all tests ✅ Frontend ready
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">MK</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Mike Kumar</div>
                      <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 mt-1">
                        Deploying now... 🔄
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">PR</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">Priya Roy</div>
                      <div className="bg-orange-50 rounded-lg p-3 text-sm text-gray-700 mt-1">
                        <span className="font-semibold">is typing</span> <span className="animate-bounce">•••</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Input */}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400"
                      disabled
                    />
                    <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CollaborationEducationSection
