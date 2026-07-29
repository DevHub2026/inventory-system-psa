import { type SignatureBlock } from '@/services/templateService'
import { Check, UserCheck } from 'lucide-react'

interface SignatureEditorProps {
  blocks: SignatureBlock[]
  onChange: (blocks: SignatureBlock[]) => void
}

const DEFAULT_BLOCKS: SignatureBlock[] = [
  { key: 'prepared_by', label: 'Prepared By', name: '{{prepared_by}}', position: 'Property Custodian', enabled: true },
  { key: 'approved_by', label: 'Approved By', name: 'Department Head', position: 'Supervising Officer', enabled: true },
  { key: 'received_by', label: 'Received By', name: '{{employee_name}}', position: 'Borrower / Recipient', enabled: true },
  { key: 'witnessed_by', label: 'Witnessed By', name: '', position: 'Witness', enabled: false },
]

export function SignatureEditor({ blocks, onChange }: SignatureEditorProps) {
  const activeBlocks = blocks && blocks.length > 0 ? blocks : DEFAULT_BLOCKS

  const handleToggle = (index: number) => {
    const next = [...activeBlocks]
    next[index] = { ...next[index], enabled: !next[index].enabled }
    onChange(next)
  }

  const handleFieldChange = (index: number, field: keyof SignatureBlock, value: string) => {
    const next = [...activeBlocks]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Signature Blocks</h4>
          <p className="text-[12px] text-slate-500">
            Enable or disable required signature lines and customize their titles and signatory positions.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <UserCheck size={14} />
          <span>{activeBlocks.filter((b) => b.enabled).length} Enabled</span>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {activeBlocks.map((block, idx) => (
          <div
            key={block.key || idx}
            className={`rounded-xl border p-3.5 transition-all ${
              block.enabled
                ? 'border-[#0D47A1]/30 bg-white shadow-xs'
                : 'border-slate-200 bg-slate-50/60 opacity-60'
            }`}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={() => handleToggle(idx)}
                  className="h-4 w-4 rounded-md accent-[#0D47A1]"
                />
                <span>{block.label || `Block ${idx + 1}`}</span>
              </label>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  block.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {block.enabled ? (
                  <>
                    <Check size={10} /> Active
                  </>
                ) : (
                  'Disabled'
                )}
              </span>
            </div>

            {block.enabled && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Label Title</label>
                  <input
                    type="text"
                    value={block.label}
                    onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                    placeholder="e.g. Prepared By"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Signatory Name</label>
                  <input
                    type="text"
                    value={block.name}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    placeholder="e.g. {{prepared_by}} or Juan Dela Cruz"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Designation / Position</label>
                  <input
                    type="text"
                    value={block.position}
                    onChange={(e) => handleFieldChange(idx, 'position', e.target.value)}
                    placeholder="e.g. Property Custodian"
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
