import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#161B22] text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1117] border-b border-gray-200 dark:border-[#30363D]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
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
          {/* Project Name & Purpose */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Task Manager and Chat Application</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This application is a comprehensive platform that combines task management, project collaboration, and integrated chat functionality to help teams work efficiently together.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h3 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-600 dark:text-gray-300">
              By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* User Responsibilities */}
          <section>
            <h3 className="text-xl font-semibold mb-3">2. User Responsibilities</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to accept responsibility for all activities under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You are responsible for all content you upload, create, or share</li>
              <li>You must be at least 18 years old to use this service</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h3 className="text-xl font-semibold mb-3">3. Acceptable Use Policy</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              You agree not to use the application in any way that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Violates any applicable law, regulation, or third-party rights</li>
              <li>Transmits malware, viruses, or any code of destructive nature</li>
              <li>Attempts to gain unauthorized access to our systems</li>
              <li>Harasses, threatens, or abuses other users</li>
              <li>Spams, sends unsolicited messages, or engages in phishing</li>
              <li>Impersonates any person or entity</li>
              <li>Uploads illegal content or intellectual property violations</li>
            </ul>
          </section>

          {/* Account Security */}
          <section>
            <h3 className="text-xl font-semibold mb-3">4. Account Security</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We implement industry-standard security measures to protect your account. However, you are responsible for keeping your password confidential and for all activity on your account. We are not liable for unauthorized access resulting from your failure to protect your credentials.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h3 className="text-xl font-semibold mb-3">5. Data Collection</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              We collect certain information to provide and improve our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Account information (name, email, profile details)</li>
              <li>Usage data (features used, activity logs, analytics)</li>
              <li>Device information (IP address, browser type, device model)</li>
              <li>Communication data (messages, tasks, project content)</li>
              <li>Payment information (if applicable)</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <h3 className="text-xl font-semibold mb-3">6. Data Usage</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your data is used to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Provide and maintain the application</li>
              <li>Improve user experience and service quality</li>
              <li>Send important notifications and updates</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and abuse</li>
            </ul>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h3 className="text-xl font-semibold mb-3">7. Cookies and Tracking Technologies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We use cookies, local storage, and similar tracking technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can disable cookies through your browser settings, but this may affect certain features.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h3 className="text-xl font-semibold mb-3">8. Third-Party Services</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              This application integrates with third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>
                <strong>Cloudinary:</strong> For secure file storage and image optimization
              </li>
              <li>
                <strong>Google OAuth:</strong> For account authentication and sign-in
              </li>
              <li>
                <strong>GitHub OAuth:</strong> For developer authentication and integration
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mt-3">
              These services have their own terms and privacy policies. We are not responsible for their practices.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h3 className="text-xl font-semibold mb-3">9. Intellectual Property Rights</h3>
            <p className="text-gray-600 dark:text-gray-300">
              The application and its content, including text, graphics, logos, and software, are the property of the application owners or their content suppliers. You may not reproduce, distribute, or transmit the content without permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h3 className="text-xl font-semibold mb-3">10. Limitation of Liability</h3>
            <p className="text-gray-600 dark:text-gray-300">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the application, including but not limited to data loss, business interruption, or other losses.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h3 className="text-xl font-semibold mb-3">11. Disclaimer of Warranties</h3>
            <p className="text-gray-600 dark:text-gray-300">
              The application is provided "as is" without any warranties of any kind. We do not guarantee that the application will be uninterrupted, error-free, or secure.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h3 className="text-xl font-semibold mb-3">12. Termination</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We reserve the right to terminate or suspend your account at any time if you violate these terms or engage in prohibited conduct. Upon termination, your right to use the application will immediately cease.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-xl font-semibold mb-3">13. Contact Information</h3>
            <p className="text-gray-600 dark:text-gray-300">
              For questions about these Terms of Service, please contact us through the application's support channels or submit an inquiry through our contact form.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h3 className="text-xl font-semibold mb-3">14. Changes to Terms</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We may update these terms at any time. Continued use of the application following notification of changes constitutes your acceptance of the updated terms.
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
