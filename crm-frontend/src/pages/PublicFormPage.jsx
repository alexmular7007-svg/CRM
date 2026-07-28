import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { leadMagnetService } from '../services/leadMagnetService'
import PublicFormComponent from '../components/leadmagnet/PublicFormComponent'
import SuccessScreen from '../components/leadmagnet/SuccessScreen'
import { Zap } from 'lucide-react'

const PublicFormPage = () => {
  const { publicToken, slug } = useParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)

  // Fetch magnet
  const { data: magnet, isLoading, error } = useQuery({
    queryKey: ['public-lead-magnet', publicToken],
    queryFn: () => leadMagnetService.getPublicLeadMagnet(publicToken),
  })

  // Check if slug matches
  useEffect(() => {
    if (magnet && magnet.slug !== slug) {
      // Slug doesn't match - could redirect or show error
      // For now, we'll just continue to show the form
    }
  }, [magnet, slug])

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data) =>
      leadMagnetService.submitPublicForm(publicToken, data),
    onSuccess: (data) => {
      setSubmissionData(data)
      setShowSuccess(true)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0D1117] dark:to-[#161B22]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-violet-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !magnet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0D1117] dark:to-[#161B22]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Campaign Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The lead magnet campaign you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    )
  }

  if (!magnet.active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0D1117] dark:to-[#161B22]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Campaign Inactive
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This campaign is currently inactive. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0D1117] dark:to-[#161B22] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Header/Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
        </div>

        {showSuccess ? (
          <SuccessScreen
            magnet={magnet}
            submissionData={submissionData}
            onClose={() => {
              setShowSuccess(false)
              window.close()
            }}
          />
        ) : (
          <PublicFormComponent
            magnet={magnet}
            onSubmit={(data) => submitMutation.mutate(data)}
            isLoading={submitMutation.isPending}
            error={submitMutation.error}
          />
        )}
      </div>
    </div>
  )
}

export default PublicFormPage
