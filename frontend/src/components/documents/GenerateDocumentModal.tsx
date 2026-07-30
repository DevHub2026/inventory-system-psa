import { useState } from 'react'
import { Modal, Button, Spinner, Alert } from '@/components/ui'
import { templateService } from '@/services/templateService'
import { Download } from 'lucide-react'

interface GenerateDocumentModalProps {
  open: boolean
  onClose: () => void
  documentType: 'borrow_receipt' | 'return_receipt' | 'issuance' | 'property_transfer' | 'clearance' | 'reissuance'
  targetId: number | null
  title?: string
}

export function GenerateDocumentModal({
  open,
  onClose,
  documentType,
  targetId,
  title = 'Generate Document',
}: GenerateDocumentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleGenerate() {
    if (!targetId) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await templateService.generateDocument(documentType, targetId)
      setSuccess('Document generated and download started.')
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No active DOCX template is configured for this document type. Please contact a system administrator.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button disabled={loading || !targetId} onClick={() => void handleGenerate()}>
            <Download size={16} className="mr-1.5" />
            {loading ? 'Generating…' : 'Generate DOCX'}
          </Button>
        </>
      }
    >
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner label="Generating official document…" />
        </div>
      )}
      {!loading && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            The system will load the active DOCX template, fill verified placeholders with live data,
            and download the completed Word document.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
        </div>
      )}
    </Modal>
  )
}
