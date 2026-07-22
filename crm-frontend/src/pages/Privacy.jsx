import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Database, Eye, Share2, Trash2, Mail, Cookie, Key, Cloud, RefreshCw, User } from 'lucide-react'

// v2.0.0 - Professional Privacy Policy Page

const Privacy = () => {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your Privacy Matters</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  At TaskFlow CRM, we prioritize your privacy and data protection. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our application and services, including the mobile app, web platform, and all associated features.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                  <span className="font-semibold">Last Updated:</span> July 22, 2026
                </p>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Database className="text-blue-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Information We Collect</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We collect information in various ways to provide and improve our services:
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <User size={18} />
                      Account Information
                    </h3>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                      <li>• Full name, email address, phone number</li>
                      <li>• Profile photo and biographical information</li>
                      <li>• Password (encrypted)</li>
                      <li>• Company/organization name and industry</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                      <Database size={18} />
                      Workspace & Project Data
                    </h3>
                    <ul className="text-purple-800 dark:text-purple-200 text-sm space-y-1">
                      <li>• Projects, tasks, and timeline information</li>
                      <li>• Client and lead information</li>
                      <li>• Team member roles and permissions</li>
                      <li>• Custom fields and workspace settings</li>
                    </ul>
                  </div>

                  <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-2 flex items-center gap-2">
                      <Mail size={18} />
                      Chat Messages
                    </h3>
                    <ul className="text-cyan-800 dark:text-cyan-200 text-sm space-y-1">
                      <li>• Direct and group messages</li>
                      <li>• Message content and metadata</li>
                      <li>• Chat attachments and links</li>
                      <li>• Message timestamps and sender information</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2 flex items-center gap-2">
                      <Cloud size={18} />
                      Uploaded Files
                    </h3>
                    <ul className="text-orange-800 dark:text-orange-200 text-sm space-y-1">
                      <li>• Documents, images, and media files</li>
                      <li>• File metadata (name, size, upload date)</li>
                      <li>• File sharing and access logs</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                      <Eye size={18} />
                      Technical Information
                    </h3>
                    <ul className="text-green-800 dark:text-green-200 text-sm space-y-1">
                      <li>• IP address and device information</li>
                      <li>• Browser type and version</li>
                      <li>• Operating system</li>
                      <li>• Usage analytics and feature interactions</li>
                      <li>• Logs and error reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Lock className="text-teal-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">How We Use Your Information</h2>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Providing and improving our services</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Processing transactions and sending related information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Sending promotional communications (with your consent)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Responding to your inquiries and support requests</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Monitoring and analyzing trends and usage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Detecting, preventing, and addressing fraud and security issues</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span>Ensuring compliance with legal obligations</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Shield className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Data Security</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We implement comprehensive security measures to protect your personal information:
                </p>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔒</span>
                    <span>End-to-end encryption for sensitive data in transit and at rest</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔒</span>
                    <span>Regular security audits and vulnerability assessments</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔒</span>
                    <span>Secure authentication protocols and two-factor authentication (2FA)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔒</span>
                    <span>Access controls limiting employee access to customer data</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">🔒</span>
                    <span>Automated backups to prevent data loss</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Share2 className="text-pink-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Third-Party Services</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We integrate with trusted third-party services to enhance our platform:
                </p>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Google OAuth & Services</h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      We use Google OAuth for secure authentication. Google handles your login credentials and may collect usage analytics. Please review Google's Privacy Policy.
                    </p>
                  </div>

                  <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">GitHub OAuth</h3>
                    <p className="text-gray-300 text-sm">
                      GitHub OAuth is used for developer authentication. GitHub maintains your login credentials and may collect usage information.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Cloudinary - File Storage</h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                      We use Cloudinary for secure file uploads and image hosting. Your files are encrypted and stored in Cloudinary's global infrastructure.
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                      <li>• Files are stored with access controls</li>
                      <li>• Only authenticated users can access their files</li>
                      <li>• Cloudinary provides redundancy and disaster recovery</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Email Services</h3>
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      We use secure email services to send notifications, password resets, and alerts. Email content is encrypted in transit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Cookie className="text-amber-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Cookies & Tracking</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We use cookies to enhance your experience:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Session Cookies:</span> Maintain your login session during browsing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Preference Cookies:</span> Remember your theme and settings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Analytics Cookies:</span> Help us understand how you use the platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>You can control cookies through your browser settings</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Key className="text-purple-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Data Retention</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  We retain your information for as long as necessary to provide our services:
                </p>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Active Accounts:</span> Data retained while your account is active</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Deleted Accounts:</span> Retained for 30 days for recovery purposes</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Backups:</span> Maintained for disaster recovery (typically 90 days)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span><span className="font-semibold">Legal Holds:</span> May retain longer for compliance</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Your Privacy Rights */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Eye className="text-cyan-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your Privacy Rights (GDPR & CCPA)</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Depending on your location, you may have specific rights:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Access:</span> Request a copy of your personal data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Rectification:</span> Correct inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Erasure:</span> Request deletion of your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Restrict Processing:</span> Limit how we use your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Portability:</span> Export your data in a standard format</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                    <span><span className="font-semibold">Right to Object:</span> Opt-out of certain processing</span>
                  </li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                  Contact us at privacy@taskflow.com to exercise these rights.
                </p>
              </div>
            </div>
          </section>

          {/* Account Deletion */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Trash2 className="text-red-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Deletion & Data Removal</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You can request complete account deletion anytime:
                </p>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                  <ul className="space-y-2 text-red-800 dark:text-red-200 text-sm">
                    <li>1. Go to Settings → Account → Delete Account</li>
                    <li>2. Request a data export for backup (available for 30 days)</li>
                    <li>3. Confirm deletion - all personal data will be permanently removed</li>
                    <li>4. Workspace/project data may be retained by other workspace members</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Shield className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Children's Privacy</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  TaskFlow CRM is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal information, we will delete such information and terminate the child's account immediately. Parents/guardians can contact us to report such incidents.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <Mail className="text-green-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or our data practices:
                </p>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold">Privacy Team:</span> privacy@taskflow.com</p>
                  <p><span className="font-semibold">Data Protection Officer:</span> dpo@taskflow.com</p>
                  <p><span className="font-semibold">General Support:</span> support@taskflow.com</p>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Changes */}
          <section className="bg-white dark:bg-[#1A1A1D] rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <RefreshCw className="text-teal-500 flex-shrink-0 mt-1" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Changes to This Privacy Policy</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We may update this Privacy Policy periodically. Material changes will be communicated via email or a prominent notice on our website. Your continued use of TaskFlow CRM after updates constitutes acceptance of the new policy.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Last Updated: July 22, 2026
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
              © 2026 TaskFlow CRM. All rights reserved. GDPR compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
