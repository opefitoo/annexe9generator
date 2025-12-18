import { pdfApi } from '../../services/api'

interface PDFPreviewProps {
  orderId: string
}

export function PDFPreview({ orderId }: PDFPreviewProps) {
  const previewUrl = pdfApi.getPreviewUrl(orderId)

  return (
    <div className="w-full h-full min-h-[600px] border rounded-lg overflow-hidden">
      <iframe
        src={previewUrl}
        className="w-full h-full"
        title="PDF Preview"
      />
    </div>
  )
}
