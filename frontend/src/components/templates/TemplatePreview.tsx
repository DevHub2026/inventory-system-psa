import { type DocumentTemplate, type SignatureBlock } from '@/services/templateService'
import logoFallback from '@/assets/logo.png'
import { Eye } from 'lucide-react'
import { resolvePlaceholders } from './templatePlaceholders'

interface TemplatePreviewProps {
  template: Partial<DocumentTemplate>
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const logo       = template.logo_url || logoFallback
  const orgName    = template.header_org_name   || 'PHILIPPINE STATISTICS AUTHORITY'
  const officeName = template.header_office_name || 'Regional Statistical Services Office'
  const title      = template.header_title       || template.name || 'DOCUMENT TITLE'
  const body       = resolvePlaceholders(template.body_template || 'Template body text goes here...')
  const footerText  = template.footer_text  || ''
  const footerNotes = template.footer_notes || ''

  const allBlocks: SignatureBlock[] = (template.signature_blocks as SignatureBlock[]) || []
  // Only render blocks explicitly enabled (strict boolean OR truthy integer from backend)
  const sigBlocks = allBlocks.filter((b) => b.enabled === true || (b.enabled as unknown) === 1)

  const fontFamily  = template.font_family   || 'Arial'
  const fontSize    = template.font_size     || 12
  const textAlign   = (template.text_alignment || 'left') as 'left' | 'center' | 'right'
  const isLandscape = template.orientation   === 'landscape'
  const paperLabel  = `${template.paper_size || 'A4'} • ${template.orientation || 'portrait'}`

  const mT = Math.max(12, Math.min(32, (template.margin_top    || 25) * 0.55))
  const mB = Math.max(12, Math.min(32, (template.margin_bottom || 25) * 0.55))
  const mL = Math.max(14, Math.min(32, (template.margin_left   || 25) * 0.55))
  const mR = Math.max(14, Math.min(32, (template.margin_right  || 25) * 0.55))

  // Distribute signatures evenly — max 3 per row
  const sigCols = sigBlocks.length <= 3 ? sigBlocks.length : 3

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRadius: 18, border: '1px solid #E2E8F0',
      background: '#EEF2F8', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid #E2E8F0',
        background: '#fff', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Eye size={15} color="#1E40AF"/>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0F172A' }}>
            Live Preview
          </span>
        </div>
        <span style={{
          fontSize: 10.5, fontWeight: 600, color: '#475569',
          background: '#F1F5F9', borderRadius: 20, padding: '3px 10px',
          border: '1px solid #E2E8F0',
        }}>
          {paperLabel}
        </span>
      </div>

      {/* ── Paper area ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        background: '#DDE3EE',
      }}>
        {/* Paper sheet */}
        <div style={{
          width: '100%',
          maxWidth: isLandscape ? 660 : 480,
          minHeight: isLandscape ? 360 : 540,
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
          border: '1px solid #D1D5DB',
          display: 'flex', flexDirection: 'column',
          fontFamily, fontSize: `${fontSize}px`,
          paddingTop: `${mT}px`, paddingBottom: `${mB}px`,
          paddingLeft: `${mL}px`, paddingRight: `${mR}px`,
          boxSizing: 'border-box',
        }}>

          {/* ── Document header ── */}
          <div style={{ borderBottom: '1.5px solid #374151', paddingBottom: 10, marginBottom: 14, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
              <img src={logo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', background: 'transparent' }}/>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, letterSpacing: '0.04em', color: '#0F172A', lineHeight: 1.2, fontSize: `${Math.max(9, fontSize - 1)}px` }}>
                  {orgName}
                </div>
                <div style={{ color: '#475569', fontSize: `${Math.max(8, fontSize - 3)}px`, lineHeight: 1.3 }}>
                  {officeName}
                </div>
              </div>
            </div>
            <div style={{
              fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#0F172A', fontSize: `${Math.max(11, fontSize + 1)}px`,
              marginTop: 6,
            }}>
              {title}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{
            flex: 1,
            color: '#1E293B',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.75,
            textAlign,
            fontSize: `${fontSize}px`,
          }}>
            {body}
          </div>

          {/* ── Signatures ── */}
          {sigBlocks.length > 0 && (
            <div style={{
              marginTop: 28,
              paddingTop: 14,
              borderTop: '1px solid #CBD5E1',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${sigCols}, 1fr)`,
                gap: '12px 16px',
              }}>
                {sigBlocks.map((block, idx) => (
                  <div key={block.key || idx} style={{ textAlign: 'center' }}>
                    {/* Role label */}
                    <div style={{
                      fontSize: `${Math.max(7, fontSize - 4)}px`,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#64748B',
                      marginBottom: 20,
                    }}>
                      {block.label}
                    </div>
                    {/* Signature line */}
                    <div style={{ borderBottom: '1.5px solid #0F172A', paddingBottom: 3 }}>
                      {resolvePlaceholders(block.name)?.trim() ? (
                        <div style={{
                          fontWeight: 700,
                          fontSize: `${Math.max(9, fontSize - 1)}px`,
                          color: '#0F172A',
                          letterSpacing: '0.01em',
                        }}>
                          {resolvePlaceholders(block.name)}
                        </div>
                      ) : (
                        <div style={{ height: 16 }} />
                      )}
                    </div>
                    {/* Position */}
                    <div style={{
                      fontSize: `${Math.max(7, fontSize - 4)}px`,
                      color: '#475569',
                      marginTop: 4,
                    }}>
                      {block.position}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          {(footerText || footerNotes) && (
            <div style={{
              marginTop: 16, paddingTop: 10,
              borderTop: '1px solid #E2E8F0',
              textAlign: 'center',
            }}>
              {footerText && (
                <div style={{ fontSize: `${Math.max(8, fontSize - 3)}px`, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                  {footerText}
                </div>
              )}
              {footerNotes && (
                <div style={{ fontSize: `${Math.max(7, fontSize - 4)}px`, fontStyle: 'italic', color: '#94A3B8' }}>
                  {footerNotes}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
