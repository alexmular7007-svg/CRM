import { format } from 'date-fns'

const SubmissionsTable = ({ magnet }) => {
  const submissions = magnet.recentSubmissions || []

  return (
    <div className="bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#30363D]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent Submissions
        </h3>
      </div>

      {submissions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No submissions yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-200 dark:border-[#30363D]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 dark:border-[#21262D] hover:bg-gray-50 dark:hover:bg-[#0D1117]"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {submission.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {submission.email}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {submission.company || '-'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SubmissionsTable
