import { Eye, Users, FormInput, TrendingUp } from 'lucide-react'

const AnalyticsCards = ({ magnet }) => {
  const conversionRate = magnet.views > 0
    ? ((magnet.submissions / magnet.views) * 100).toFixed(2)
    : 0

  const cards = [
    {
      title: 'Total Views',
      value: magnet.views || 0,
      icon: Eye,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Unique Views',
      value: magnet.uniqueViews || 0,
      icon: Users,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Submissions',
      value: magnet.submissions || 0,
      icon: FormInput,
      color: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className="bg-white dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AnalyticsCards
