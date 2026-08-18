import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Mail, Users, TrendingUp, BarChart3, Activity } from 'lucide-react'
import { emailCampaignService } from '../services/emailCampaignService'
import CampaignStatusBadge from '../components/emailcampaign/CampaignStatusBadge'
import Spinner from '../components/common/Spinner'

export default function EmailCampaignDetails() {
  const { id } = useParams()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  const [activeTab, setActiveTab] = useState('overview')
  
  const campaign = useQuery({
    queryKey: ['email-campaign', currentWorkspace?.id, id],
    queryFn: () => emailCampaignService.getCampaign(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id
  })
  
  const recipients = useQuery({
    queryKey: ['email-campaign-recipients', currentWorkspace?.id, id],
    queryFn: () => emailCampaignService.listRecipients(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id
  })

  const analytics = useQuery({
    queryKey: ['email-campaign-analytics', currentWorkspace?.id, id],
    queryFn: () => emailCampaignService.getAnalytics(currentWorkspace.id, id),
    enabled: !!currentWorkspace?.id && !!id
  })

  if (campaign.isLoading) return <div className="space-y-4 p-6 animate-pulse"><div className="h-8 w-64 rounded bg-gray-200 dark:bg-[#21262D]" /><div className="h-48 rounded bg-gray-100 dark:bg-[#161B22]" /></div>
  if (campaign.isError) return <div className="p-6"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">Unable to load this campaign.</div></div>
  
  const item = campaign.data
  const recipientItems = recipients.data?.content || []
  const analyticsData = analytics.data || {}

  // Use backend metrics if available, otherwise fallback to recipient count
  const metrics = [
    { label: 'Recipients', value: analyticsData.totalSent || item.totalRecipients || recipientItems.length, icon: Users },
    { label: 'Delivered', value: analyticsData.totalDelivered || 0, icon: Mail },
    { label: 'Opened', value: analyticsData.totalOpened || 0, icon: Mail },
    { label: 'Clicked', value: analyticsData.totalClicked || 0, icon: Mail }
  ]

  // Calculate rates
  const recipientCount = analyticsData.totalSent || item.totalRecipients || recipientItems.length || 1
  const deliveryRate = metrics[0].value > 0 ? ((metrics[1].value / metrics[0].value) * 100).toFixed(1) : 0
  const openRate = metrics[1].value > 0 ? ((metrics[2].value / metrics[1].value) * 100).toFixed(1) : 0
  const clickRate = metrics[1].value > 0 ? ((metrics[3].value / metrics[1].value) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-4">
        <Link to="/marketing/email-campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700">
          <ArrowLeft size={16} />Back to Email Campaigns
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
              <CampaignStatusBadge status={item.status} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
          </div>
        </div>

        {/* Campaign Subject Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 dark:border-[#30363D] dark:bg-[#161B22]">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Subject</p>
          <p className="mt-2 text-lg font-medium text-gray-900 dark:text-white break-words">{item.subject}</p>
        </div>

        {/* Campaign Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
            <p className="text-xs text-gray-600 dark:text-gray-400">Campaign ID</p>
            <p className="mt-2 font-mono text-sm font-semibold text-gray-900 dark:text-white">#{item.id}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
            <p className="text-xs text-gray-600 dark:text-gray-400">Created</p>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
            <p className="text-xs text-gray-600 dark:text-gray-400">Sent</p>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {item.sendStartedAt ? new Date(item.sendStartedAt).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
            <p className="text-xs text-gray-600 dark:text-gray-400">Type</p>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{item.contentType || 'Template'}</p>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Overview</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
              <Icon size={18} className="text-violet-600" />
              <p className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Rates */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-[#30363D] dark:bg-[#161B22]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Delivery Rate</p>
                <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{deliveryRate}%</p>
              </div>
              <TrendingUp size={28} className="text-green-600" />
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-[#21262D]">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{width: `${deliveryRate}%`}}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-[#30363D] dark:bg-[#161B22]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Open Rate</p>
                <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{openRate}%</p>
              </div>
              <TrendingUp size={28} className="text-blue-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-[#21262D]">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{width: `${openRate}%`}}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-[#30363D] dark:bg-[#161B22]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Click Rate</p>
                <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{clickRate}%</p>
              </div>
              <TrendingUp size={28} className="text-purple-600" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-[#21262D]">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{width: `${clickRate}%`}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-[#30363D]">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'recipients', label: 'Recipients', icon: Users },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 sm:px-4 border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-[#30363D] dark:bg-[#161B22]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Events Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-[#21262D]">
                  <span className="text-gray-700 dark:text-gray-300">Delivered</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{metrics[1].value}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-[#21262D]">
                  <span className="text-gray-700 dark:text-gray-300">Opened</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{metrics[2].value}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-[#21262D]">
                  <span className="text-gray-700 dark:text-gray-300">Clicked</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{metrics[3].value}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Bounced</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{analyticsData.totalBounced || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recipients' && (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-[#30363D] dark:bg-[#161B22] overflow-hidden">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 dark:border-[#30363D]">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recipient Activity</h3>
            </div>
            {recipients.isLoading ? (
              <div className="p-6"><Spinner size="md" /></div>
            ) : recipientItems.length === 0 ? (
              <div className="p-6 text-sm text-gray-600 dark:text-gray-400">No recipients have been added.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#0D1117]">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Delivered</th>
                      <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Opened</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#21262D]">
                    {recipientItems.map((recipient) => (
                      <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-[#21262D] transition-colors">
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 dark:text-white break-all">{recipient.recipientEmail}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            recipient.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            recipient.status === 'OPENED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                            recipient.status === 'CLICKED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                            recipient.status === 'BOUNCED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {recipient.status}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {recipient.deliveredAt ? new Date(recipient.deliveredAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {recipient.openedAt ? new Date(recipient.openedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {recipient.clickCount || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-[#30363D] dark:bg-[#161B22]">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Campaign Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1 bg-violet-600 rounded-full" />
                <div className="pb-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Campaign Created</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {item.sendStartedAt && (
                <div className="flex gap-4">
                  <div className="w-1 bg-green-600 rounded-full" />
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Campaign Sent</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Date(item.sendStartedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
