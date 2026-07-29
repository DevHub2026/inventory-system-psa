import { type DocumentTemplate, type SignatureBlock } from '@/services/templateService'
import logoFallback from '@/assets/logo.png'
import { Eye } from 'lucide-react'

interface TemplatePreviewProps {
  template: Partial<DocumentTemplate>
}

// Sample data for live template resolution
const SAMPLE_DATA: Record<string, string> = {
  employee_name: 'Juan Dela Cruz',
  employee_number: '20250012',
  department: 'Information Technology Division',
  office: 'PSA Regional Office VII',
  asset_name: 'Dell Latitude 5420 Laptop',
  asset_code: 'PSA-LAP-2026-0042',
  serial_number: 'SN-994810234',
  manufacturer: 'Dell Technologies',
  category: 'IT Equipment',
  condition: 'Good',
  borrow_date: '2026-07-28',
  due_date: '2026-08-11',
  returned_date: '2026-08-05',
  requested_extension: '2026-08-25',
  approved_extension: '2026-08-25',
  issued_date: '2026-07-28',
  current_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  current_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  prepared_by: 'Maria Santos',
  generated_by: 'System Administrator',
}

export function resolvePlaceholders(text: string | null | undefined): string {
  if (!text) return ''
  let result = text
  Object.entries(SAMPLE_DATA).forEach(([key, val]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(placeholder, val)
  })
  return result
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const logo = template.logo_url || logoFallback
  const orgName = template.header_org_name || 'PHILIPPINE STATISTICS AUTHORITY'
  const officeName = template.header_office_name || 'Regional Statistical Services Office'
  const title = template.header_title || template.name || 'DOCUMENT TITLE'
  const body = resolvePlaceholders(template.body_template || 'Template body text goes here...')
  const footerText = template.footer_text || ''
  const footerNotes = template.footer_notes || ''

  const blocks: SignatureBlock[] = (template.signature_blocks as SignatureBlock[]) || []
  const activeBlocks = blocks.filter((b) => b.enabled)

  // Typography & Styling
  const fontFamily = template.font_family || 'Arial'
  const fontSize = template.font_size || 12
  const textAlign = (template.text_alignment || 'left') as 'left' | 'center' | 'right'

  // Margin style (proportional scaling for preview)
  const marginTop = Math.max(12, Math.min(36, (template.margin_top || 25) * 0.6))
  const marginBottom = Math.max(12, Math.min(36, (template.margin_bottom || 25) * 0.6))
  const marginLeft = Math.max(12, Math.min(36, (template.margin_left || 25) * 0.6))
  const marginRight = Math.max(12, Math.min(36, (template.margin_right || 25) * 0.6))

  const isLandscape = template.orientation === 'landscape'
  const paperSizeLabel = `${template.paper_size || 'A4'} • ${template.orientation || 'portrait'}`

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-slate-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-[#0D47A1]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Preview</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          {paperSizeLabel}
        </span>
      </div>

      {/* Preview Sheet Area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center bg-slate-200/70">
        <div
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            paddingTop: `${marginTop}px`,
            paddingBottom: `${marginBottom}px`,
            paddingLeft: `${marginLeft}px`,
            paddingRight: `${marginRight}px`,
            minHeight: isLandscape ? '400px' : '580px',
            width: isLandscape ? '100%' : '100%',
            maxWidth: isLandscape ? '680px' : '520px',
          }}
          className="bg-white rounded-lg shadow-md border border-slate-200 flex flex-col justify-between transition-all"
        >
          {/* Header */}
          <div className="border-b border-slate-300 pb-3 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={logo} alt="PSA Logo" className="h-10 w-10 object-contain" />
              <div className="text-left">
                <p className="font-bold tracking-wide text-slate-900 leading-tight" style={{ fontSize: `${Math.max(10, fontSize - 1)}px` }}>
                  {orgName}
                </p>
                <p className="text-slate-600 leading-tight" style={{ fontSize: `${Math.max(9, fontSize - 3)}px` }}>
                  {officeName}
                </p>
              </div>
            </div>
            <h3 className="mt-2 font-bold tracking-wider text-slate-900 uppercase" style={{ fontSize: `${Math.max(12, fontSize + 2)}px` }}>
              {title}
            </h3>
          </div>

          {/* Body Content */}
          <div className="my-4 flex-1 whitespace-pre-wrap leading-relaxed text-slate-800" style={{ textAlign }}>
            {body}
          </div>

          {/* Signatures */}
          {activeBlocks.length > 0 && (
            <div className="my-4 pt-3 border-t border-slate-200">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(activeBlocks.length, 3)}, 1fr)` }}>
                {activeBlocks.map((block, idx) => (
                  <div key={block.key || idx} className="text-center">
                    <p className="text-[10px] font-semibold uppercase text-slate-500 mb-6">{block.label}</p>
                    <div className="border-b border-slate-800 pb-1">
                      <p className="font-bold text-slate-900" style={{ fontSize: `${Math.max(10, fontSize - 1)}px` }}>
                        {resolvePlaceholders(block.name)}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">{block.position}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-2 text-center text-[10px] text-slate-500 space-y-0.5">
            {footerText && <p className="font-medium text-slate-700">{footerText}</p>}
            {footerNotes && <p className="italic text-slate-400">{footerNotes}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
