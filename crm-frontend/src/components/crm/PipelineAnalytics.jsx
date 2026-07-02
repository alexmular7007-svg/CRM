import { motion } from 'framer-motion'
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts'
import { FiTrendingUp, FiDollarSign, FiUsers, FiAward } from 'react-icons/fi'
import { useThemeContext } from '../../contexts/ThemeContext'

const PipelineAnalytics = ({ analytics }) => {
  const { currentTheme } = useThemeContext()
  
  const COLORS = {
    LEAD: currentTheme.colors.textMuted,
    QUALIFIED: currentTheme.colors.info,
    PROPOSAL: currentTheme.colors.primary,
    NEGOTIATION: currentTheme.colors.warning,
    WON: currentTheme.colors.success,
    LOST: currentTheme.colors.danger
  }

  if (!analytics) return null

  const formatCurrency = (value) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Prepare data for charts
  const statusData = Object.entries(analytics.leadsByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count,
    amount: analytics.valueByStatus?.[status] || 0
  }))

  const valueData = Object.entries(analytics.valueByStatus || {}).map(([status, value]) => ({
    name: status,
    value: value
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analytics.totalPipelineValue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FiDollarSign className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Won Deals</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(analytics.wonValue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FiAward className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.conversionRate?.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FiTrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalLeads}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <FiUsers className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Leads by Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Value by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Value by Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: currentTheme.colors.surface, 
                  border: `1px solid ${currentTheme.colors.border}`,
                  borderRadius: '8px',
                  color: currentTheme.colors.text
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {valueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sales Performance */}
      {analytics.assigneePerformance && analytics.assigneePerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Sales Rep
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Leads
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total Value
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Avg Deal Size
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.assigneePerformance.map((assignee, index) => (
                  <tr
                    key={assignee.userId}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                          {assignee.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignee.userName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {assignee.leadsCount}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(assignee.totalValue)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(assignee.totalValue / assignee.leadsCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PipelineAnalytics
