import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSelector } from 'react-redux'
import LeadMagnetForm from './LeadMagnetForm'

const LeadMagnetModal = ({ isOpen, onClose, magnet }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#161B22] rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#30363D]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {magnet ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262D] rounded"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4">
          <LeadMagnetForm magnet={magnet} onSuccess={onClose} />
        </div>
      </div>
    </div>
  )
}

export default LeadMagnetModal
