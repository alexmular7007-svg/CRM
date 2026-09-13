/**
 * Simple PDF Writer - Manifest V3 Compatible
 * Zero-dependency pure JavaScript PDF 1.4 generator.
 * Converts canvas images / slices into standard, valid multi-page PDF documents.
 * Compatible with Chrome extension service workers, popup windows, and Node.js.
 */

/**
 * Convert base64 data (without data URL prefix) to Uint8Array
 */
export function base64ToUint8Array(base64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert Latin1/ASCII string to Uint8Array
 */
export function stringToUint8Array(str) {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff
  }
  return bytes
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatUint8Arrays(arrays) {
  let totalLength = 0
  for (const arr of arrays) {
    totalLength += arr.length
  }
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

/**
 * Build a valid PDF 1.4 binary document containing the given image pages.
 * Each item in pages: { width, height, jpegBytes, mediaBoxWidth, mediaBoxHeight }
 * Returns Uint8Array of the complete valid PDF file.
 */
export function buildPdfBinary(pages) {
  if (!pages || pages.length === 0) {
    throw new Error('At least one page is required to generate a PDF.')
  }

  const totalPages = pages.length
  const objects = []
  const pageObjIds = []

  // Object 1: Catalog
  // Object 2: Pages tree
  // For each page i (0-indexed):
  //   pageObjId = 3 + i * 3
  //   contentId = pageObjId + 1
  //   imgId     = pageObjId + 2
  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(3 + i * 3)
  }

  // 1: Catalog
  objects.push({
    id: 1,
    content: '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
  })

  // 2: Pages tree
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ')
  objects.push({
    id: 2,
    content: `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj`,
  })

  for (let i = 0; i < totalPages; i++) {
    const pageId = 3 + i * 3
    const contentId = pageId + 1
    const imgId = pageId + 2
    const page = pages[i]

    // Standard A4: 595.28 x 841.89 pt (72 DPI)
    const mbW = page.mediaBoxWidth || 595.28
    const mbH = page.mediaBoxHeight || 841.89

    // Scale image within mediaBox: fill width, preserve height or fit
    const imgDrawW = mbW
    const imgDrawH = mbH

    // 3: Page object
    objects.push({
      id: pageId,
      content: `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${mbW.toFixed(2)} ${mbH.toFixed(2)}] /Contents ${contentId} 0 R /Resources << /XObject << /Im${i + 1} ${imgId} 0 R >> >> >>\nendobj`,
    })

    // 4: Content stream (matrix: w 0 0 h x y cm)
    // Draw image to fill the page
    const drawCmd = `q\n${imgDrawW.toFixed(2)} 0 0 ${imgDrawH.toFixed(2)} 0 0 cm\n/Im${i + 1} Do\nQ\n`
    const drawCmdBytes = stringToUint8Array(drawCmd)
    objects.push({
      id: contentId,
      content: `${contentId} 0 obj\n<< /Length ${drawCmdBytes.length} >>\nstream\n${drawCmd}endstream\nendobj`,
    })

    // 5: Image XObject with /Filter /DCTDecode for JPEG data
    const imgHeader = `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
    const imgFooter = '\nendstream\nendobj'
    objects.push({
      id: imgId,
      isImage: true,
      header: imgHeader,
      body: page.jpegBytes,
      footer: imgFooter,
    })
  }

  // Assemble parts and track byte offsets
  const parts = []
  const headerStr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  parts.push(stringToUint8Array(headerStr))

  let currentOffset = parts[0].length
  const offsets = [0] // index 0 is dummy for 0000000000 65535 f

  for (const obj of objects) {
    offsets.push(currentOffset)
    if (obj.isImage) {
      const hBytes = stringToUint8Array(obj.header)
      const fBytes = stringToUint8Array(obj.footer + '\n')
      parts.push(hBytes)
      parts.push(obj.body)
      parts.push(fBytes)
      currentOffset += hBytes.length + obj.body.length + fBytes.length
    } else {
      const bytes = stringToUint8Array(obj.content + '\n')
      parts.push(bytes)
      currentOffset += bytes.length
    }
  }

  // Xref table
  const startxref = currentOffset
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  parts.push(stringToUint8Array(xref))

  return concatUint8Arrays(parts)
}

/**
 * Multi-page canvas slicer and PDF generator.
 * Takes a full-page Canvas (either HTMLCanvasElement or OffscreenCanvas),
 * slices it into proportionate pages, and compiles a valid PDF Blob or Data URL.
 */
export async function createPdfFromCanvas(canvas) {
  const totalW = canvas.width
  const totalH = canvas.height

  // Standard A4 dimensions in PDF points (72pt / inch): 595.28 x 841.89
  const a4WidthPt = 595.28
  const a4HeightPt = 841.89
  const a4Ratio = a4HeightPt / a4WidthPt // ~1.414

  // Height in canvas pixels that corresponds to one A4 page
  const pageSliceHeightPx = Math.floor(totalW * a4Ratio)

  const pages = []
  let yOffset = 0

  while (yOffset < totalH) {
    const currentSliceH = Math.min(pageSliceHeightPx, totalH - yOffset)

    // Create slice canvas
    let sliceCanvas
    if (typeof OffscreenCanvas !== 'undefined') {
      sliceCanvas = new OffscreenCanvas(totalW, currentSliceH)
    } else {
      sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = totalW
      sliceCanvas.height = currentSliceH
    }

    const sliceCtx = sliceCanvas.getContext('2d')
    // Fill white background in case of transparent areas
    sliceCtx.fillStyle = '#FFFFFF'
    sliceCtx.fillRect(0, 0, totalW, currentSliceH)

    // Draw slice from master canvas
    sliceCtx.drawImage(
      canvas,
      0,
      yOffset,
      totalW,
      currentSliceH,
      0,
      0,
      totalW,
      currentSliceH
    )

    // Convert slice to JPEG base64
    let base64Data
    if (sliceCanvas.convertToBlob) {
      const blob = await sliceCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
      const buffer = await blob.arrayBuffer()
      pages.push({
        width: totalW,
        height: currentSliceH,
        jpegBytes: new Uint8Array(buffer),
        mediaBoxWidth: a4WidthPt,
        mediaBoxHeight: (currentSliceH / totalW) * a4WidthPt,
      })
    } else if (sliceCanvas.toDataURL) {
      const dataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92)
      base64Data = dataUrl.split(',')[1]
      const jpegBytes = base64ToUint8Array(base64Data)
      pages.push({
        width: totalW,
        height: currentSliceH,
        jpegBytes,
        mediaBoxWidth: a4WidthPt,
        mediaBoxHeight: (currentSliceH / totalW) * a4WidthPt,
      })
    } else {
      throw new Error('Canvas conversion method not available.')
    }

    yOffset += currentSliceH
  }

  const pdfBinary = buildPdfBinary(pages)
  return pdfBinary
}

/**
 * Convert PDF Uint8Array to Data URL for Chrome downloads API
 */
export function pdfBinaryToDataUrl(pdfBytes) {
  let binary = ''
  const len = pdfBytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i])
  }
  return `data:application/pdf;base64,${btoa(binary)}`
}
