import { useState } from 'react'
import { type SignatureBlock } from '@/services/templateService'
import { UserCheck, Check } from 'lucide-react'

interface SignatureEditorProps {
  blocks: SignatureBlock[]
  onChange: (blocks: SignatureBlock[]) => void
}

const DEFAULT_BLOCKS: SignatureBlock[] = [
  { key: 'received_by',  label: 'Received & Inspected By', name: '{{prepared_by}}',    position: 'Inventory Inspector',  enabled: true  },
  { key: 'approved_by',  label: 'Approved By',             name: 'Property Custodian', position: 'Custodian Officer',    enabled: true  },
  { key: 'returned_by',  label: 'Returned By',             name: '{{employee_name}}',  position: 'Borrower',             enabled: true  },
  { key: 'witnessed_by', label: 'Witnessed By',            name: '',                   position: 'Witness',              enabled: false },
]

// ─── Field row ────────────────────────────────────────────────────────────────
function SigField({
  label, value, onChange, mono = false, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  mono?: boolean; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', height: 34, borderRadius: 8,
          border: `1px solid ${focused ? '#1E40AF' : '#E2E8F0'}`,
          background: focused ? '#FAFEFF' : '#fff',
          padding: '0 10px',
          fontSize: 12.5, color: '#0F172A',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.12s, background 0.12s',
          boxShadow: focused ? '0 0 0 3px rgba(30,64,175,0.07)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// ─── Single block card ────────────────────────────────────────────────────────
function SignatureBlockCard({
  block, index,
  onToggle, onFieldChange,
}: {
  block: SignatureBlock; index: number
  onToggle: () => void
  onFieldChange: (field: keyof SignatureBlock, value: string) => void
}) {
  const enabled = block.enabled

  return (
    <div style={{
      borderRadius: 14,
      border: `1.5px solid ${enabled ? '#BFDBFE' : '#E8EDF5'}`,
      background: enabled ? '#fff' : '#F8FAFC',
      overflow: 'hidden',
      opacity: enabled ? 1 : 0.65,
      transition: 'all 0.18s',
      boxShadow: enabled ? '0 2px 10px rgba(30,64,175,0.07)' : 'none',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: enabled ? 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)' : '#F8FAFC',
        borderBottom: `1px solid ${enabled ? '#DBEAFE' : '#EEF2F7'}`,
      }}>
        {/* Checkbox + label */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={onToggle}
            style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${enabled ? '#1E40AF' : '#CBD5E1'}`,
              background: enabled ? '#1E40AF' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            {enabled && <Check size={11} color="#fff" strokeWidth={3}/>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: enabled ? '#0F172A' : '#94A3B8' }}>
            {block.label || `Block ${index + 1}`}
          </span>
        </label>

        {/* Status badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10.5, fontWeight: 700,
          color: enabled ? '#059669' : '#64748B',
          background: enabled ? '#ECFDF5' : '#F1F5F9',
          border: `1px solid ${enabled ? '#A7F3D0' : '#E2E8F0'}`,
          borderRadius: 20, padding: '2px 9px',
        }}>
          {enabled
            ? <><Check size={9} strokeWidth={3}/> Active</>
            : 'Disabled'
          }
        </span>
      </div>

      {/* Fields — only when enabled */}
      {enabled && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SigField
            label="Label Title"
            value={block.label}
            onChange={(v) => onFieldChange('label', v)}
            placeholder="e.g. Prepared By"
          />
          <SigField
            label="Signatory Name"
            value={block.name ?? ''}
            onChange={(v) => onFieldChange('name', v)}
            placeholder="e.g. {{prepared_by}} or Juan Dela Cruz"
            mono
          />
          <SigField
            label="Designation / Position"
            value={block.position ?? ''}
            onChange={(v) => onFieldChange('position', v)}
            placeholder="e.g. Property Custodian"
          />
        </div>
      )}

      {/* Disabled placeholder */}
      {!enabled && (
        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0 }}>
            Enable this block to configure signature details.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SignatureEditor({ blocks, onChange }: SignatureEditorProps) {
  const activeBlocks = (blocks && blocks.length > 0 ? blocks : DEFAULT_BLOCKS).map(b => ({
    ...b,
    enabled: b.enabled === true || (b.enabled as unknown) === 1,
  }))
  const enabledCount = activeBlocks.filter((b) => b.enabled).length

  const handleToggle = (i: number) => {
    const next = [...activeBlocks]
    next[i] = { ...next[i], enabled: !next[i].enabled }
    onChange(next)
  }

  const handleFieldChange = (i: number, field: keyof SignatureBlock, value: string) => {
    const next = [...activeBlocks]
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#334155', marginBottom: 4 }}>
            Signature Blocks
          </div>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Enable or disable required signature lines and customize their titles and signatory positions.
          </p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
          fontSize: 12, fontWeight: 600, color: '#1E40AF',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 20, padding: '4px 12px',
        }}>
          <UserCheck size={13}/> {enabledCount} Enabled
        </div>
      </div>

      {/* Grid of cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
        alignItems: 'start',
      }}>
        {activeBlocks.map((block, idx) => (
          <SignatureBlockCard
            key={block.key || idx}
            block={block}
            index={idx}
            onToggle={() => handleToggle(idx)}
            onFieldChange={(field, value) => handleFieldChange(idx, field, value)}
          />
        ))}
      </div>

    </div>
  )
}
