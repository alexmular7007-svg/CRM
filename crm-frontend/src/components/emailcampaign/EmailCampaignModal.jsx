import { useEffect } from 'react'
import { X } from 'lucide-react'
import EmailCampaignForm from './EmailCampaignForm'

export default function EmailCampaignModal({ isOpen, onClose, campaign }) {
  useEffect(() => {
    if (isOpen) {
      console.log('ðŸŽ¯ MODAL MOUNT')
      return () => {
        console.log('ðŸŽ¯ MODAL UNMOUNT')
      }
    }
  }, [isOpen])

  const handleClose = () => {
    console.log('ðŸš¨ CLOSE BUTTON CLICKED')
    onClose()
  }

  console.log("DEBUG_MODAL_PROPS", { isOpen, campaign });
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="campaign-modal-title">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-[#161B22]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-[#30363D]">
          <h2 id="campaign-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">{campaign ? 'Edit Email Campaign' : 'Create Email Campaign'}</h2>
          <button type="button" onClick={handleClose} aria-label="Close campaign form" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-[#21262D]"><X size={20} className="text-gray-600 dark:text-gray-400" /></button>
        </div>
        <div className="px-6 py-4"><EmailCampaignForm campaign={campaign} onSuccess={onClose} /></div>
      </div>
    </div>
  )
}


