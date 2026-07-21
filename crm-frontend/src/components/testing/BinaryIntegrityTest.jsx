import { useState } from 'react'
import { toast } from 'sonner'
import api from '../../services/api'

/**
 * Binary Integrity Verification Test Component
 * 
 * Tests:
 * 1. Upload PDF file
 * 2. Compute SHA-256 BEFORE upload
 * 3. Monitor Cloudinary response
 * 4. Download file back
 * 5. Compute SHA-256 AFTER download
 * 6. Compare hashes
 * 7. Verify HTTP response headers
 */
export default function BinaryIntegrityTest() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const computeSHA256 = async (bytes) => {
    const buffer = await crypto.subtle.digest('SHA-256', bytes)
    const hashArray = Array.from(new Uint8Array(buffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const runTest = async (file) => {
    try {
      setTesting(true)
      setLogs([])
      setResults(null)

      addLog('═══════════════════════════════════════════════════════════', 'header')
      addLog('🔐 BINARY INTEGRITY VERIFICATION - START', 'header')
      addLog('═══════════════════════════════════════════════════════════', 'header')

      // ═══════════════════════════════════════════════════════════
      // STEP 1: INPUT VERIFICATION
      // ═══════════════════════════════════════════════════════════
      addLog(`📋 [INPUT] File: ${file.name}`, 'info')
      addLog(`     Type: ${file.type}`, 'info')
      addLog(`     Size: ${file.size} bytes`, 'info')

      const fileBytes = new Uint8Array(await file.arrayBuffer())
      addLog(`     Actual bytes: ${fileBytes.length} bytes`, 'info')
      addLog(`     Size match: ${file.size === fileBytes.length ? '✅ YES' : '❌ NO'}`, file.size === fileBytes.length ? 'success' : 'error')

      // ═══════════════════════════════════════════════════════════
      // STEP 2: COMPUTE SHA-256 BEFORE UPLOAD
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [HASH BEFORE UPLOAD]', 'info')
      const hashBefore = await computeSHA256(fileBytes)
      addLog(`     SHA-256: ${hashBefore}`, 'success')
      addLog(`     First 20 bytes: ${Array.from(fileBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`, 'info')
      addLog(`     Last 20 bytes: ${Array.from(fileBytes.slice(-20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`, 'info')

      // ═══════════════════════════════════════════════════════════
      // STEP 3: PDF SIGNATURE CHECK (if PDF)
      // ═══════════════════════════════════════════════════════════
      if (file.name.endsWith('.pdf')) {
        addLog('📋 [PDF VERIFICATION]', 'info')
        const pdfSignature = new TextDecoder().decode(fileBytes.slice(0, 8))
        addLog(`     Starts with %PDF: ${pdfSignature.startsWith('%PDF') ? '✅ YES' : '❌ NO'}`, pdfSignature.startsWith('%PDF') ? 'success' : 'error')
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 4: UPLOAD TO BACKEND
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [UPLOAD] Sending to backend...', 'info')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomId', '1') // Test room ID

      let attachmentId = null
      try {
        const uploadResponse = await api.post('/chat/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        
        if (uploadResponse.data?.data?.id) {
          attachmentId = uploadResponse.data.data.id
          addLog(`     ✅ Upload successful - Attachment ID: ${attachmentId}`, 'success')
        } else if (uploadResponse.data?.data?.attachmentId) {
          attachmentId = uploadResponse.data.data.attachmentId
          addLog(`     ✅ Upload successful - Attachment ID: ${attachmentId}`, 'success')
        }
      } catch (error) {
        addLog(`     ❌ Upload failed: ${error.message}`, 'error')
        throw error
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 5: GET DOWNLOAD URL + METADATA
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [METADATA] Fetching from backend...', 'info')
      
      let downloadUrl = null
      let responseFilename = null
      let responseMimeType = null
      try {
        const metaResponse = await api.get(`/attachments/${attachmentId}/url`)
        
        if (metaResponse.data?.data) {
          downloadUrl = metaResponse.data.data.downloadUrl
          responseFilename = metaResponse.data.data.filename
          responseMimeType = metaResponse.data.data.mimeType
          
          addLog(`     ✅ Filename: ${responseFilename}`, 'success')
          addLog(`     MIME Type: ${responseMimeType}`, 'info')
          addLog(`     Secure URL: ${downloadUrl}`, 'info')
        }
      } catch (error) {
        addLog(`     ❌ Failed to get metadata: ${error.message}`, 'error')
        throw error
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 6: DOWNLOAD FILE AND CHECK HEADERS
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [DOWNLOAD] Fetching from Cloudinary...', 'info')
      
      let downloadedBytes = null
      try {
        const downloadResponse = await fetch(downloadUrl)
        
        addLog(`     Status: ${downloadResponse.status}`, downloadResponse.status === 200 ? 'success' : 'error')
        addLog(`     Content-Type: ${downloadResponse.headers.get('Content-Type')}`, 'info')
        addLog(`     Content-Length: ${downloadResponse.headers.get('Content-Length')}`, 'info')
        addLog(`     Content-Disposition: ${downloadResponse.headers.get('Content-Disposition') || 'N/A'}`, 'info')

        if (downloadResponse.status !== 200) {
          addLog(`     ❌ Download failed with status ${downloadResponse.status}`, 'error')
          throw new Error(`HTTP ${downloadResponse.status}`)
        }

        const contentType = downloadResponse.headers.get('Content-Type')
        if (!contentType.includes('pdf') && !contentType.includes('application')) {
          addLog(`     ⚠️ WARNING: Unexpected Content-Type: ${contentType}`, 'warn')
        }

        downloadedBytes = new Uint8Array(await downloadResponse.arrayBuffer())
        addLog(`     ✅ Downloaded: ${downloadedBytes.length} bytes`, 'success')
      } catch (error) {
        addLog(`     ❌ Download failed: ${error.message}`, 'error')
        throw error
      }

      // ═══════════════════════════════════════════════════════════
      // STEP 7: COMPUTE SHA-256 AFTER DOWNLOAD
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [HASH AFTER DOWNLOAD]', 'info')
      const hashAfter = await computeSHA256(downloadedBytes)
      addLog(`     SHA-256: ${hashAfter}`, 'success')

      // ═══════════════════════════════════════════════════════════
      // STEP 8: COMPARE HASHES
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [HASH COMPARISON]', 'info')
      const hashesMatch = hashBefore === hashAfter
      addLog(`     Before:  ${hashBefore}`, 'info')
      addLog(`     After:   ${hashAfter}`, 'info')
      addLog(`     Match:   ${hashesMatch ? '✅ YES - PERFECT' : '❌ NO - CORRUPTED'}`, hashesMatch ? 'success' : 'error')

      // ═══════════════════════════════════════════════════════════
      // STEP 9: SIZE VERIFICATION
      // ═══════════════════════════════════════════════════════════
      addLog('📋 [SIZE VERIFICATION]', 'info')
      const sizeMatch = file.size === downloadedBytes.length
      addLog(`     Original:  ${file.size} bytes`, 'info')
      addLog(`     Downloaded: ${downloadedBytes.length} bytes`, 'info')
      addLog(`     Match:   ${sizeMatch ? '✅ YES' : '❌ NO'}`, sizeMatch ? 'success' : 'error')

      // ═══════════════════════════════════════════════════════════
      // RESULTS
      // ═══════════════════════════════════════════════════════════
      addLog('═══════════════════════════════════════════════════════════', 'header')
      addLog('🔐 BINARY INTEGRITY VERIFICATION - RESULTS', 'header')
      addLog('═══════════════════════════════════════════════════════════', 'header')

      const testResults = {
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        originalSize: file.size,
        downloadedSize: downloadedBytes.length,
        hashBefore,
        hashAfter,
        hashesMatch,
        sizeMatch,
        contentType: responseMimeType,
        downloadUrl,
        status: hashesMatch && sizeMatch ? '✅ PASS' : '❌ FAIL'
      }

      setResults(testResults)

      if (hashesMatch && sizeMatch) {
        addLog('✅ ALL TESTS PASSED - FILE INTEGRITY VERIFIED', 'success')
      } else {
        addLog('❌ TESTS FAILED - FILE CORRUPTED', 'error')
      }

    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error')
      toast.error('Test failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await runTest(file)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🔐 Binary Integrity Test
      </h2>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Select a PDF file to test:
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={testing}
          className="block w-full text-sm text-gray-900 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4 file:rounded
            file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200
            hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
        />
      </div>

      {/* Results */}
      {results && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
            Results: {results.status}
          </h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1">File</span>: {results.filename}</p>
            <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1">Size</span>: {results.originalSize} bytes</p>
            <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1">SHA256</span>: {results.hashBefore.substring(0, 32)}...</p>
            <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1">Match</span>: {results.hashesMatch ? '✅ YES' : '❌ NO'}</p>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Logs will appear here...</div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'warn' ? 'text-yellow-400' : ''}
                ${log.type === 'header' ? 'text-blue-400 font-bold my-2' : ''}
              `}
            >
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
