import { CheckCircle, Mail, Calendar, Share2, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const SuccessModal = ({ magnet, submissionData, onClose }) => {
  const [showDetails, setShowDetails] = useState(false)

  const handleShare = (platform) => {
    const text = `Just claimed an exclusive offer from ${magnet.name}! 🎉`
    const url = window.location.href

    const platforms = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(magnet.name)}&body=${encodeURIComponent(`Check this out: ${url}`)}`,
    }

    if (platforms[platform]) {
      window.open(platforms[platform], '_blank')
      toast.success('Shared!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      {/* Success Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* Success Content */}
        <div className="relative p-8 sm:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-white" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Thank You! 🎉
          </h1>

          <p className="text-gray-600 text-base sm:text-lg mb-2">
            Your request has been received
          </p>

          {/* Secondary Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-green-900">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>✓ Check your email for confirmation</li>
              <li>✓ Our team will review your request</li>
              <li>✓ You'll receive an update within 24 hours</li>
            </ul>
          </div>

          {/* Submission Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail size={16} />
              Submitted Information
            </h3>

            <div className="space-y-3 text-sm">
              {submissionData?.name && (
                <div>
                  <p className="text-gray-500 mb-1">Name</p>
                  <p className="text-gray-900 font-medium">{submissionData.name}</p>
                </div>
              )}
              {submissionData?.email && (
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="text-gray-900 font-medium">{submissionData.email}</p>
                </div>
              )}
              {submissionData?.phone && (
                <div>
                  <p className="text-gray-500 mb-1">Phone</p>
                  <p className="text-gray-900 font-medium">{submissionData.phone}</p>
                </div>
              )}
              {submissionData?.company && (
                <div>
                  <p className="text-gray-500 mb-1">Company</p>
                  <p className="text-gray-900 font-medium">{submissionData.company}</p>
                </div>
              )}
            </div>

            {/* Show More Details Button */}
            {submissionData?.status && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium mt-4"
              >
                {showDetails ? 'Hide' : 'Show'} all details
              </button>
            )}

            {showDetails && submissionData?.status && (
              <div className="pt-4 border-t border-gray-200">
                <div>
                  <p className="text-gray-500 mb-1 text-xs">Status</p>
                  <p className="text-gray-900 font-medium text-sm">{submissionData.status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">Share the good news</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleShare('twitter')}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                LinkedIn
              </button>
              <button
                onClick={() => handleShare('email')}
                className="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Email
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Close
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 mt-6">
            We take your privacy seriously. Your information will never be shared.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal
