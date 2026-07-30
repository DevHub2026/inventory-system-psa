import { useState } from 'react'
import { type DocumentTemplate, type SignatureBlock } from '@/services/templateService'
import { PlaceholderPicker } from './PlaceholderPicker'
import { SignatureEditor } from './SignatureEditor'
import { LogoUploader } from './LogoUploader'
import { Layout, Type, FileText, PenTool, Settings, RotateCcw, Save } from 'lucide-react'
import { Input } from '@/components/ui'

interface TemplateEditorProps {
  template: Partial<DocumentTemplate>
  onChange: (updated: Partial<DocumentTemplate>) => void
  onSave: () => void
  onRestoreDefault: () => void
  saving?: boolean
}

type TabKey = 'body' | 'header' | 'footer' | 'signatures' | 'page' | 'typography'

// ─── Shared field label style ─────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: '#334155', marginBottom: 6,
}

// ─── Shared select style ──────────────────────────────────────────────────────
const sel: React.CSSProperties = {
  width: '100%', height: 38, borderRadius: 10, border: '1px solid #E2E8F0',
  background: '#fff', padding: '0 12px',
  fontSize: 13, color: '#1E293B', outline: 'none',
  fontFamily: 'inherit', cursor: 'pointer',
}

// ─── Toggle button (paper size / orientation / font / etc.) ──────────────────
function ToggleBtn({ label, active, onClick, style }: {
  label: string; active: boolean; onClick: () => void; style?: React.CSSProperties
}) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, height: 36, borderRadius: 8, border: `1.5px solid ${active ? '#1E40AF' : '#E2E8F0'}`,
      background: active ? '#EFF6FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 12.5, fontWeight: 600, color: active ? '#1E40AF' : '#475569',
      transition: 'all 0.12s', ...style,
    }}>{label}</button>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>
      {children}
    </div>
  )
}

export function TemplateEditor({ template, onChange, onSave, onRestoreDefault, saving = false }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('body')

  const handleBodyInsert = (token: string) => {
    const cur = template.body_template || ''
    onChange({ ...template, body_template: cur ? `${cur} ${token}` : token })
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'body',        label: 'Body',       icon: FileText  },
    { key: 'header',      label: 'Header',     icon: Layout    },
    { key: 'footer',      label: 'Footer',     icon: PenTool   },
    { key: 'signatures',  label: 'Signatures', icon: PenTool   },
    { key: 'page',        label: 'Page Setup', icon: Settings  },
    { key: 'typography',  label: 'Typography', icon: Type      },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRadius: 18, border: '1px solid #E2E8F0',
      background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
        background: '#FAFBFC', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{template.name || 'Edit Template'}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>Customize header, placeholders, signatures, and page layout.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={onRestoreDefault} style={{
            height: 34, paddingInline: 14, borderRadius: 8,
            border: '1px solid #E2E8F0', background: '#fff', color: '#475569',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.1s',
          }}
            onMouseEnter={(e)=>{(e.currentTarget as HTMLButtonElement).style.background='#F8FAFC'}}
            onMouseLeave={(e)=>{(e.currentTarget as HTMLButtonElement).style.background='#fff'}}
          >
            <RotateCcw size={13}/> Restore Default
          </button>
          <button type="button" onClick={onSave} disabled={saving} style={{
            height: 34, paddingInline: 16, borderRadius: 8,
            border: 'none', background: saving ? '#93C5FD' : '#1E40AF', color: '#fff',
            fontSize: 12.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.1s',
          }}
            onMouseEnter={(e)=>{ if(!saving)(e.currentTarget as HTMLButtonElement).style.background='#1D3FAB' }}
            onMouseLeave={(e)=>{ if(!saving)(e.currentTarget as HTMLButtonElement).style.background='#1E40AF' }}
          >
            <Save size={13}/> {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #E2E8F0',
        background: '#F8FAFC', padding: '0 6px', flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', fontSize: 12, fontWeight: 600,
              border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: active ? '#1E40AF' : '#64748B',
              borderBottom: `2px solid ${active ? '#1E40AF' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
              transition: 'color 0.12s',
            }}>
              <Icon size={13}/>{tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>

        {/* BODY */}
        {activeTab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={lbl}>Template Body Text</label>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Use placeholders to auto-populate data</span>
              </div>
              <textarea rows={9} value={template.body_template || ''}
                onChange={(e) => onChange({ ...template, body_template: e.target.value })}
                placeholder="Enter template body text. Use {{placeholder}} tokens for dynamic variables..."
                style={{
                  width: '100%', borderRadius: 10, border: '1px solid #E2E8F0',
                  background: '#FAFBFC', padding: '12px', fontFamily: 'ui-monospace, monospace',
                  fontSize: 12.5, color: '#1E293B', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', lineHeight: 1.6,
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e)=>{e.currentTarget.style.borderColor='#1E40AF'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(30,64,175,0.08)'}}
                onBlur={(e)=>{e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.boxShadow='none'}}
              />
            </div>
            <PlaceholderPicker onInsert={handleBodyInsert}/>
          </div>
        )}

        {/* HEADER */}
        {activeTab === 'header' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LogoUploader logoUrl={template.logo_url} onChange={(url)=>onChange({...template,logo_url:url})}/>
            <Input label="Organization Name" value={template.header_org_name||''} onChange={(e)=>onChange({...template,header_org_name:e.target.value})} placeholder="PHILIPPINE STATISTICS AUTHORITY"/>
            <Input label="Office Name" value={template.header_office_name||''} onChange={(e)=>onChange({...template,header_office_name:e.target.value})} placeholder="Regional Statistical Services Office"/>
            <Input label="Document Title" value={template.header_title||''} onChange={(e)=>onChange({...template,header_title:e.target.value})} placeholder="PROPERTY BORROW RECEIPT"/>
          </div>
        )}

        {/* FOOTER */}
        {activeTab === 'footer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>Footer Text</label>
              <input type="text" value={template.footer_text||''} onChange={(e)=>onChange({...template,footer_text:e.target.value})}
                placeholder="e.g. Official Document — Philippine Statistics Authority"
                style={{ width:'100%', height:38, borderRadius:10, border:'1px solid #E2E8F0', padding:'0 12px', fontSize:13, color:'#1E293B', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
            </div>
            <div>
              <label style={lbl}>Footer Notes / Instructions</label>
              <textarea rows={4} value={template.footer_notes||''} onChange={(e)=>onChange({...template,footer_notes:e.target.value})}
                placeholder="e.g. Unreturned items after due date are subject to property accountability review."
                style={{ width:'100%', borderRadius:10, border:'1px solid #E2E8F0', padding:'10px 12px', fontSize:13, color:'#1E293B', outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}/>
            </div>
          </div>
        )}

        {/* SIGNATURES */}
        {activeTab === 'signatures' && (
          <SignatureEditor blocks={(template.signature_blocks as SignatureBlock[])||[]} onChange={(b)=>onChange({...template,signature_blocks:b})}/>
        )}

        {/* PAGE SETUP */}
        {activeTab === 'page' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <SectionLabel>Paper Size</SectionLabel>
                <div style={{ display:'flex', gap:8 }}>
                  {(['A4','Letter'] as const).map(s=>(
                    <ToggleBtn key={s} label={s} active={template.paper_size===s} onClick={()=>onChange({...template,paper_size:s})}/>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Orientation</SectionLabel>
                <div style={{ display:'flex', gap:8 }}>
                  {(['portrait','landscape'] as const).map(o=>(
                    <ToggleBtn key={o} label={o.charAt(0).toUpperCase()+o.slice(1)} active={template.orientation===o} onClick={()=>onChange({...template,orientation:o})}/>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <SectionLabel>Page Margins (mm)</SectionLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {(['margin_top','margin_bottom','margin_left','margin_right'] as const).map((k)=>(
                  <div key={k}>
                    <label style={{ ...lbl, fontSize:11, marginBottom:4, textTransform:'capitalize' as const }}>{k.replace('margin_','')}</label>
                    <input type="number" min={5} max={50} value={template[k]??25} onChange={(e)=>onChange({...template,[k]:parseInt(e.target.value)||25})}
                      style={{ width:'100%', height:36, borderRadius:8, border:'1px solid #E2E8F0', padding:'0 10px', fontSize:13, color:'#1E293B', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const }}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TYPOGRAPHY */}
        {activeTab === 'typography' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <SectionLabel>Font Family</SectionLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {(['Arial','Calibri','Times New Roman'] as const).map(f=>(
                  <ToggleBtn key={f} label={f} active={template.font_family===f} onClick={()=>onChange({...template,font_family:f})} style={{ fontFamily:f }}/>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <SectionLabel>Font Size (pt)</SectionLabel>
                <div style={{ display:'flex', gap:8 }}>
                  {([10,11,12,14] as const).map(s=>(
                    <ToggleBtn key={s} label={String(s)} active={template.font_size===s} onClick={()=>onChange({...template,font_size:s})}/>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Text Alignment</SectionLabel>
                <div style={{ display:'flex', gap:8 }}>
                  {(['left','center','right'] as const).map(a=>(
                    <ToggleBtn key={a} label={a.charAt(0).toUpperCase()+a.slice(1)} active={template.text_alignment===a} onClick={()=>onChange({...template,text_alignment:a})}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
