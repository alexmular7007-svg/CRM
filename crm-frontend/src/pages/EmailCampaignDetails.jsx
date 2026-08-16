import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Users, TrendingUp } from 'lucide-react'
import { emailCampaignService } from '../services/emailCampaignService'
import CampaignStatusBadge from '../components/emailcampaign/CampaignStatusBadge'
import Spinner from '../components/common/Spinner'
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function EmailCampaignDetails() {
  const { id } = useParams()
  const { currentWorkspace } = useSelector((state) => state.workspace)
  
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
    { label: 'Recipients', value: analyticsData.totalRecipients || item.totalRecipients || recipientItems.length, icon: Users },
    { label: 'Delivered', value: analyticsData.deliveredCount || 0, icon: Mail },
    { label: 'Opened', value: analyticsData.openedCount || 0, icon: Mail },
    { label: 'Clicked', value: analyticsData.clickedCount || 0, icon: Mail }
  ]

  // Calculate rates
  const deliveryRate = metrics[0].value > 0 ? ((metrics[1].value / metrics[0].value) * 100).toFixed(1) : 0
  const openRate = metrics[1].value > 0 ? ((metrics[2].value / metrics[1].value) * 100).toFixed(1) : 0
  const clickRate = metrics[1].value > 0 ? ((metrics[3].value / metrics[1].value) * 100).toFixed(1) : 0

  return <div className="space-y-6 p-6">
    <Link to="/marketing/email-campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"><ArrowLeft size={16} />Back to Email Campaigns</Link>
    
    <div className="flex items-center gap-3"><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{item.name}</h1><CampaignStatusBadge status={item.status} /></div>
    
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-[#30363D] dark:bg-[#161B22]"><p className="text-sm text-gray-500 dark:text-gray-400">Subject</p><p className="mt-1 font-medium text-gray-900 dark:text-white">{item.subject}</p></div>
    
    {/* Main Metrics */}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]"><Icon size={18} className="text-violet-600" /><p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-sm text-gray-600 dark:text-gray-400">{label}</p></div>)}</div>

    {/* Analytics Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{deliveryRate}%</p>
            </div>
            <TrendingUp size={24} className="text-green-600" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Open Rate</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{openRate}%</p>
            </div>
            <TrendingUp size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Click Rate (CTR)</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{clickRate}%</p>
            </div>
            <TrendingUp size={24} className="text-purple-600" />
          </div>
        </div>
      </div>

    {/* Recipients Table */}
    <div className="rounded-lg border border-gray-200 bg-white dark:border-[#30363D] dark:bg-[#161B22]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-[#30363D]"><h2 className="font-semibold text-gray-900 dark:text-white">Recipients</h2></div>
      {recipients.isLoading ? <div className="p-5"><Spinner size="md" /></div> : recipientItems.length === 0 ? <div className="p-5 text-sm text-gray-600 dark:text-gray-400">No recipients have been added.</div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="px-5 py-3 text-left text-xs">Recipient</th><th className="px-5 py-3 text-left text-xs">Status</th><th className="px-5 py-3 text-left text-xs">Delivered</th><th className="px-5 py-3 text-left text-xs">Opened</th><th className="px-5 py-3 text-left text-xs">Clicks</th></tr></thead><tbody>{recipientItems.map((recipient) => <tr key={recipient.id} className="border-t border-gray-100 dark:border-[#21262D]"><td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{recipient.recipientEmail}</td><td className="px-5 py-3 text-sm"><span className={`inline-block px-2 py-1 rounded text-xs font-medium ${recipient.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : recipient.status === 'OPENED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : recipient.status === 'CLICKED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : recipient.status === 'BOUNCED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>{recipient.status}</span></td><td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{recipient.deliveredAt ? new Date(recipient.deliveredAt).toLocaleDateString() : '-'}</td><td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{recipient.openedAt ? new Date(recipient.openedAt).toLocaleDateString() : '-'}</td><td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{recipient.clickCount || 0}</td></tr>)}</tbody></table></div>}
    </div>
  </div>
}
