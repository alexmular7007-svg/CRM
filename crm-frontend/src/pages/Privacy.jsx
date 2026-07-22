import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#161B22] text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1117] border-b border-gray-200 dark:border-[#30363D]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Last Updated */}
        <div className="mb-12 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Last Updated:</strong> July 22, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Commitment to Privacy</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Task Manager and Chat Application.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h3 className="text-xl font-semibold mb-3">1. Information We Collect</h3>
            
            <h4 className="text-lg font-medium mb-2 mt-4">Information You Provide Directly:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Account registration details (name, email, phone number)</li>
              <li>Profile information and preferences</li>
              <li>Password and security questions</li>
              <li>Content you create (tasks, messages, files, comments)</li>
              <li>Communication with our support team</li>
              <li>Payment and billing information</li>
            </ul>

            <h4 className="text-lg font-medium mb-2 mt-4">Information Collected Automatically:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Log data (IP address, browser type, pages visited, time and date)</li>
              <li>Device information (device ID, operating system, mobile network)</li>
              <li>Usage analytics (features used, time spent, click patterns)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Location information (if permissions granted)</li>
            </ul>

            <h4 className="text-lg font-medium mb-2 mt-4">Information from Third Parties:</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Google account information (when using Google OAuth)</li>
              <li>GitHub account information (when using GitHub OAuth)</li>
              <li>Information from workspace invitations</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <h3 className="text-xl font-semibold mb-3">2. How We Use Your Data</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Providing, maintaining, and improving the application</li>
              <li>Creating and managing your account</li>
              <li>Processing transactions and sending related information</li>
              <li>Sending promotional emails and important notifications</li>
              <li>Responding to inquiries and providing customer support</li>
              <li>Monitoring and analyzing trends and usage</li>
              <li>Preventing fraudulent transactions and abuse</li>
              <li>Complying with legal obligations</li>
              <li>Personalizing your experience</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h3 className="text-xl font-semibold mb-3">3. How We Share Your Information</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We do not sell or rent your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <strong>With other users:</strong> Information visible in your profile, workspace, and shared content
              </li>
              <li>
                <strong>Service providers:</strong> Third parties who assist us in operating the application
              </li>
              <li>
                <strong>Legal compliance:</strong> When required by law, court order, or government request
              </li>
              <li>
                <strong>Business transfers:</strong> In case of merger, acquisition, or sale of assets
              </li>
              <li>
                <strong>With your consent:</strong> When you explicitly authorize information sharing
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h3 className="text-xl font-semibold mb-3">4. Data Security</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>SSL/TLS encryption for data in transit</li>
              <li>Database encryption for data at rest</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and penetration testing</li>
              <li>Secure password storage with hashing</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              While we strive to protect your information, no security system is impenetrable. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h3 className="text-xl font-semibold mb-3">5. Cookies and Similar Technologies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Maintain your session and login state</li>
              <li>Remember your preferences and settings</li>
              <li>Track usage patterns and analytics</li>
              <li>Improve user experience</li>
              <li>Deliver personalized content</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              You can control cookies through your browser settings. Disabling cookies may affect certain features of the application.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h3 className="text-xl font-semibold mb-3">6. Third-Party Services</h3>
            
            <h4 className="text-lg font-medium mb-2 mt-4">Cloudinary (File Storage)</h4>
            <p className="text-gray-600 dark:text-gray-300">
              We use Cloudinary to securely store and optimize files and images. Files uploaded to Cloudinary are subject to their privacy policy and security practices.
            </p>

            <h4 className="text-lg font-medium mb-2 mt-4">Google OAuth</h4>
            <p className="text-gray-600 dark:text-gray-300">
              When you sign in with Google, we receive your email and profile information. Google handles authentication independently according to their privacy policy.
            </p>

            <h4 className="text-lg font-medium mb-2 mt-4">GitHub OAuth</h4>
            <p className="text-gray-600 dark:text-gray-300">
              When you sign in with GitHub, we receive your email and profile information. GitHub handles authentication independently according to their privacy policy.
            </p>

            <p className="text-gray-600 dark:text-gray-300 mt-3">
              We are not responsible for the privacy practices of these third-party services. Please review their privacy policies for more information.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h3 className="text-xl font-semibold mb-3">7. Data Retention</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data by contacting our support team. Some information may be retained for legal, accounting, or archival purposes.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h3 className="text-xl font-semibold mb-3">8. Your Privacy Rights</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <strong>Right to Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Right to Correction:</strong> Request correction of inaccurate information
              </li>
              <li>
                <strong>Right to Deletion:</strong> Request deletion of your data ("right to be forgotten")
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> Opt out of marketing communications
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Request your data in a portable format
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              To exercise any of these rights, contact us using the information provided below.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h3 className="text-xl font-semibold mb-3">9. Children's Privacy</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information and terminate the child's account.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-xl font-semibold mb-3">10. Contact Information</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-[#0D1117] p-4 rounded-lg border border-gray-200 dark:border-[#30363D]">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Support Email:</strong> We're available through the application's support channels
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                <strong>Contact Form:</strong> Submit inquiries through our in-app contact system
              </p>
            </div>
          </section>

          {/* Policy Changes */}
          <section>
            <h3 className="text-xl font-semibold mb-3">11. Changes to This Privacy Policy</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We may update this Privacy Policy periodically to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of significant changes by updating the "Last Updated" date and, if required, by email. Your continued use of the application following notification constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* California Privacy */}
          <section>
            <h3 className="text-xl font-semibold mb-3">12. California Privacy Rights (CCPA)</h3>
            <p className="text-gray-600 dark:text-gray-300">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA). You may request that we disclose what personal information we collect, use, share, and sell. You may also request deletion of your personal information. To exercise these rights, contact us using the information provided above.
            </p>
          </section>

          {/* GDPR Compliance */}
          <section>
            <h3 className="text-xl font-semibold mb-3">13. GDPR Compliance</h3>
            <p className="text-gray-600 dark:text-gray-300">
              If you are located in the European Union or other jurisdictions with similar data protection laws, we comply with the General Data Protection Regulation (GDPR) and similar regulations. Your personal data is processed on the basis of your consent, contractual necessity, or legitimate interests. You have the rights outlined in Section 8 of this policy.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-[#30363D]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 Task Manager and Chat Application. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  )
}
