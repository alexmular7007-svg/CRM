import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { leadMagnetService } from '../services/leadMagnetService'
import ProfessionalLandingPage from '../components/leadmagnet/ProfessionalLandingPage'
import SuccessModal from '../components/leadmagnet/SuccessModal'

const PublicFormPage = () => {
  const { publicToken, slug } = useParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)

  // Fetch magnet details
  const { data: magnet, isLoading, error } = useQuery({
    queryKey: ['public-lead-magnet', publicToken],
    queryFn: () => leadMagnetService.getPublicLeadMagnet(publicToken),
  })

  // Validate slug matches
  useEffect(() => {
    if (magnet && magnet.slug !== slug) {
      // Slug mismatch - in production, might log analytics
      console.warn(`Slug mismatch: expected ${magnet.slug}, got ${slug}`)
    }
  }, [magnet, slug])

  // Submit form mutation
  const submitMutation = useMutation({
    mutationFn: (data) =>
      leadMagnetService.submitPublicForm(publicToken, data),
    onSuccess: (data) => {
      setSubmissionData(data)
      setShowSuccess(true)
    },
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
          <p className="mt-3 text-sm text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !magnet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Inactive campaign state
  if (!magnet.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Inactive
          </h1>
          <p className="text-gray-600 mb-6">
            This campaign is currently inactive. Please try again later or contact support.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Success modal
  if (showSuccess) {
    return (
      <SuccessModal
        magnet={magnet}
        submissionData={submissionData}
        onClose={() => setShowSuccess(false)}
      />
    )
  }

  // Main landing page
  return (
    <ProfessionalLandingPage
      magnet={magnet}
      onSubmit={(data) => submitMutation.mutate(data)}
      isLoading={submitMutation.isPending}
      error={submitMutation.error}
    />
  )
}

export default PublicFormPage
