import { useState } from 'react'
import { CheckCircle, ArrowRight, Shield, Zap, Users, TrendingUp } from 'lucide-react'
import PublicFormComponent from './PublicFormComponent'

const ProfessionalLandingPage = ({ magnet, onSubmit, isLoading, error }) => {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 hidden sm:inline">TaskFlow CRM</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Limited Time Offer
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          {/* Campaign Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
            <Zap size={14} />
            {magnet.name}
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {magnet.description || magnet.name}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Get exclusive access to premium features and start growing your business today.
            Join thousands of companies already using our platform.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            Claim Your Offer Now
            <ArrowRight size={18} />
          </button>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              <span>100% Secure & Private</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span>No Credit Card Required</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
            What You'll Get
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                <Zap size={24} className="text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Lightning Fast Setup
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Get started in minutes with our intuitive interface. No technical knowledge required.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Work together seamlessly with your team in real-time. Built for modern workflows.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track your progress with powerful insights and detailed reporting dashboards.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield size={24} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Enterprise Security
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Bank-level encryption and compliance with industry standards. Your data is safe.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap size={24} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                24/7 Support
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our support team is always ready to help you succeed with priority assistance.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Users size={24} className="text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                API Integration
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect with your favorite tools through powerful APIs and webhooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Trusted by Industry Leaders
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-gray-400 font-semibold text-lg">
                Company {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-violet-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-violet-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-violet-100">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Modal/Section */}
      {showForm && (
        <section className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Claim Your Offer</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <PublicFormComponent
                magnet={magnet}
                onSubmit={(data) => {
                  onSubmit(data)
                }}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </section>
      )}

      {/* CTA Band Before Footer */}
      {!showForm && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of businesses growing with our platform. Limited spots available.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              Claim Offer Now
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-semibold text-white">TaskFlow</span>
              </div>
              <p className="text-sm">The modern CRM platform for teams.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm">&copy; 2026 TaskFlow CRM. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0 text-sm">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ProfessionalLandingPage
