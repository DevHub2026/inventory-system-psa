import { useEffect, useState } from 'react'
import { Modal, Button, Spinner, Alert } from '@/components/ui'
import { reportService } from '@/services/reportService'
import { type DocumentTemplate, type SignatureBlock } from '@/services/templateService'
import logoFallback from '@/assets/logo.png'
import { Printer } from 'lucide-react'

interface PrintableDocumentModalProps {
  open: boolean
  onClose: () => void
  documentType: 'borrow_receipt' | 'return_receipt' | 'issuance' | 'property_transfer' | 'clearance' | 'reissuance'
  targetId: number | null
  title?: string
}

export function PrintableDocumentModal({
  open,
  onClose,
  documentType,
  targetId,
  title = 'Print Document',
}: PrintableDocumentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<Partial<DocumentTemplate> | null>(null)
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || !targetId) return
    setLoading(true)
    setError(null)

    reportService
      .renderDocumentData(documentType, targetId)
      .then((data) => {
        setTemplate(data.template as Partial<DocumentTemplate>)
        setPlaceholders(data.placeholders || {})
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load document template.')
      })
      .finally(() => setLoading(false))
  }, [open, documentType, targetId])

  const resolveText = (text: string | null | undefined): string => {
    if (!text) return ''
    let result = text
    Object.entries(placeholders).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, val || '')
    })
    return result
  }

  const handlePrint = () => {
    window.print()
  }

  const logo = template?.logo_url || logoFallback
  const orgName = template?.header_org_name || 'PHILIPPINE STATISTICS AUTHORITY'
  const officeName = template?.header_office_name || 'Regional Statistical Services Office'
  const docTitle = template?.header_title || title
  const body = resolveText(template?.body_template)
  const footerText = template?.footer_text || ''
  const footerNotes = template?.footer_notes || ''

  const blocks: SignatureBlock[] = (template?.signature_blocks as SignatureBlock[]) || []
  const activeBlocks = blocks.filter((b) => b.enabled)

  const fontFamily = template?.font_family || 'Arial'
  const fontSize = template?.font_size || 12
  const textAlign = (template?.text_alignment || 'left') as 'left' | 'center' | 'right'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={720}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} disabled={loading || Boolean(error)}>
            <Printer size={16} className="mr-1.5" /> Print / Save as PDF
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Preparing printable document..." />
        </div>
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : (
        <div className="printable-area p-2">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .printable-area, .printable-area * { visibility: visible; }
              .printable-area {
                position: absolute;
                left: 0; top: 0;
                width: 100%;
                padding: 0;
              }
            }
          `}</style>

          <div
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
            }}
            className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs leading-relaxed space-y-6 text-slate-800"
          >
            {/* Header */}
            <div className="border-b border-slate-300 pb-4 text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src={logo} alt="PSA Logo" className="h-14 w-14 object-contain" />
                <div className="text-left">
                  <h2 className="font-extrabold tracking-wide text-slate-900 leading-tight" style={{ fontSize: `${fontSize + 1}px` }}>
                    {orgName}
                  </h2>
                  <p className="text-slate-600 font-medium" style={{ fontSize: `${fontSize - 2}px` }}>
                    {officeName}
                  </p>
                </div>
              </div>
              <h3 className="mt-3 font-extrabold tracking-wider text-slate-900 uppercase" style={{ fontSize: `${fontSize + 3}px` }}>
                {docTitle}
              </h3>
            </div>

            {/* Document Body */}
            <div className="my-6 whitespace-pre-wrap leading-relaxed font-normal" style={{ textAlign }}>
              {body}
            </div>

            {/* Signatures */}
            {activeBlocks.length > 0 && (
              <div className="pt-6 border-t border-slate-200 mt-8">
                <div
                  className="grid gap-6"
                  style={{ gridTemplateColumns: `repeat(${Math.min(activeBlocks.length, 3)}, 1fr)` }}
                >
                  {activeBlocks.map((block, idx) => (
                    <div key={block.key || idx} className="text-center">
                      <p className="text-[11px] font-bold uppercase text-slate-500 mb-8">{block.label}</p>
                      <div className="border-b border-slate-900 pb-1">
                        <p className="font-bold text-slate-900" style={{ fontSize: `${fontSize - 1}px` }}>
                          {resolveText(block.name)}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{block.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500 space-y-1">
              {footerText && <p className="font-semibold text-slate-700">{footerText}</p>}
              {footerNotes && <p className="italic text-slate-400 text-[11px]">{footerNotes}</p>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
