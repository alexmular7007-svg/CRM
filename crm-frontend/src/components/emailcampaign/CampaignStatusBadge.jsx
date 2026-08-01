const STYLE = {
  DRAFT: 'bg-gray-100 dark:bg-[#21262D] text-gray-700 dark:text-gray-300',
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  SENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  PAUSED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
}

export default function CampaignStatusBadge({ status }) {
  const label = status || 'DRAFT'
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${STYLE[label] || STYLE.DRAFT}`}>{label}</span>
}
