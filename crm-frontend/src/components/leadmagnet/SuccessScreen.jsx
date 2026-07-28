import { CheckCircle, Download, X } from 'lucide-react'

const SuccessScreen = ({ magnet, submissionData, onClose }) => {
  return (
    <div className="bg-white dark:bg-[#161B22] rounded-lg shadow-lg p-8 text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 blur-lg opacity-30 rounded-full" />
          <div className="relative bg-green-100 dark:bg-green-900/30 rounded-full p-4 w-20 h-20 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Thank you!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We've received your information. Check your email for the next steps.
      </p>

      {/* Confirmation */}
      <div className="bg-gray-50 dark:bg-[#0D1117] rounded-lg p-4 mb-6 text-left">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Submitted email:
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
          {submissionData?.email || 'your@email.com'}
        </p>
      </div>

      {/* Download Button (if available) */}
      {submissionData?.downloadUrl && (
        <button
          onClick={() => window.open(submissionData.downloadUrl, '_blank')}
          className="w-full mb-3 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} />
          Download Resource
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-2 border border-gray-300 dark:border-[#30363D] text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors flex items-center justify-center gap-2"
      >
        <X size={18} />
        Close
      </button>
    </div>
  )
}

export default SuccessScreen
