import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Zap, Users, Lock, AlertCircle, Trash2, RefreshCw } from 'lucide-react'

const Terms = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0A0A0D] dark:to-[#09090B]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#1A1A1D]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Shield className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Introduction</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Welcome to TaskFlow CRM - your unified platform for managing projects, teams, clients, and communications. These Terms of Service ("Terms") govern your use of our application and services. By accessing or using TaskFlow CRM, you agree to comply with these Terms. If you disagree with any part, you must not use our services.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                  Last Updated: July 22, 2026
                </p>
              </div>
            </div>
          </section>

          {/* Acceptance of Terms */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Zap className="text-amber-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Acceptance of Terms</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  By creating an account, accessing TaskFlow CRM, or using any of our services, you agree to be bound by these Terms. We may modify these Terms at any time, and continued use constitutes acceptance of the updated Terms. We will notify you of significant changes via email.
                </p>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Users className="text-blue-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">User Accounts & Registration</h2>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You must provide accurate, complete, and current information when creating an account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You are responsible for maintaining the confidentiality of your password and login credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You must be at least 18 years old to use TaskFlow CRM</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You are fully responsible for all activity that occurs under your account</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Lock className="text-green-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">User Responsibilities</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You agree to use TaskFlow CRM only for lawful purposes and in a way that does not infringe upon our or others' rights. Specifically, you agree that:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>You will maintain confidentiality of sensitive workspace and project information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>You will not share account credentials with unauthorized persons</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>You will not attempt to gain unauthorized access to TaskFlow CRM systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>You will not interfere with or disrupt the integrity or performance of the service</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Acceptable Use Policy</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You strictly agree NOT to:
                </p>
                <div className="grid gap-4">
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Prohibited Activities</h3>
                    <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                      <li>• Post or transmit illegal content, spam, or malware</li>
                      <li>• Attempt to reverse-engineer, decompile, or access source code</li>
                      <li>• Conduct phishing, fraud, or impersonation</li>
                      <li>• Use bots, scrapers, or automated tools without permission</li>
                      <li>• Harass, threaten, or abuse other users</li>
                      <li>• Violate any laws or regulations in your jurisdiction</li>
                      <li>• Share login credentials or allow unauthorized account access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Workspace & Project Rules */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Users className="text-purple-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Workspace & Project Rules</h2>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Workspace owners are responsible for managing member access and permissions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Members must respect project settings and access controls established by workspace owners</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>All data within a workspace is subject to the same security and privacy policies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Workspace owners may be held liable for member activity within their workspace</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Chat & Communication Guidelines */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Zap className="text-cyan-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Chat & Communication Guidelines</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  When using TaskFlow CRM's chat and messaging features:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>All communications are recorded and monitored for compliance purposes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Do not share passwords, financial information, or sensitive credentials in chat</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Respect others' privacy and do not share personal information without consent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Messages may be moderated or removed for policy violations</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* AI Features Disclaimer */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Zap className="text-yellow-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI Features Disclaimer</h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-900 dark:text-yellow-200 text-sm">
                    <span className="font-semibold">Important:</span> AI-powered features and suggestions are provided on an "as-is" basis. We do not guarantee accuracy or suitability for specific purposes.
                  </p>
                </div>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Always review AI-generated suggestions before relying on them</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>TaskFlow CRM is not liable for decisions made based on AI suggestions</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* File Upload Guidelines */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Lock className="text-indigo-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">File Upload Guidelines</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You are responsible for all files you upload to TaskFlow CRM:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Do not upload malware, viruses, or malicious files</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Do not upload files containing private personal information without consent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>We reserve the right to scan and remove suspicious files</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Maximum file size limits apply per workspace plan</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Shield className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Intellectual Property Rights</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  TaskFlow CRM and its content, features, and functionality are the exclusive property of TaskFlow and are protected by international intellectual property laws. You retain all rights to content you create and upload.
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You grant TaskFlow a license to use your content to provide the service</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>Do not copy, modify, or distribute TaskFlow's proprietary materials</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Account Suspension & Termination */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Trash2 className="text-red-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Suspension & Termination</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms, including:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                    <span>Repeated violations of our Acceptable Use Policy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                    <span>Unauthorized access or security breaches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                    <span>Harassment or abuse of other users</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                    <span>Non-payment of outstanding balances</span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                  Termination will result in loss of access to your account and data. You may request data export before deletion.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <RefreshCw className="text-teal-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Changes to These Terms</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  TaskFlow CRM reserves the right to modify these Terms at any time. We will notify you of material changes via email at the address associated with your account. Your continued use of the service after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-orange-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Limitation of Liability</h2>
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-4">
                  <p className="text-orange-900 dark:text-orange-200 text-sm leading-relaxed">
                    <span className="font-semibold">DISCLAIMER:</span> TaskFlow CRM is provided "AS IS" without warranties of any kind. To the maximum extent permitted by law, TaskFlow CRM is not liable for any indirect, incidental, special, or consequential damages arising from your use of the service, even if advised of the possibility of such damages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Lock className="text-green-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact Information</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  If you have questions about these Terms or our service, please contact us:
                </p>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold">Email:</span> legal@taskflow.com</p>
                  <p><span className="font-semibold">Support:</span> support@taskflow.com</p>
                  <p><span className="font-semibold">Address:</span> TaskFlow Inc., Global</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Last Updated: July 22, 2026
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
              © 2026 TaskFlow CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
