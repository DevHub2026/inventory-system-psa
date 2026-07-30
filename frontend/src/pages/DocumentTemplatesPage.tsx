import { useEffect, useState } from 'react'
import { Alert, Badge, ConfirmDialog, EmptyState, Spinner } from '@/components/ui'
import { templateService, type DocumentTemplate } from '@/services/templateService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'
import { TemplateEditor } from '@/components/templates/TemplateEditor'
import { TemplatePreview } from '@/components/templates/TemplatePreview'
import { FileText, Edit3, ArrowLeft } from 'lucide-react'

// ─── Template list card ───────────────────────────────────────────────────────
function TemplateCard({ tpl, onEdit }: { tpl: DocumentTemplate; onEdit: (t: DocumentTemplate) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 16,
        border: `1.5px solid ${hov ? '#BFDBFE' : '#E2E8F0'}`,
        boxShadow: hov ? '0 8px 24px rgba(30,64,175,0.09)' : '0 1px 6px rgba(0,0,0,0.05)',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.2s', cursor: 'default',
      }}
    >
      {/* Icon + name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={20} color="#1E40AF"/>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{tpl.name}</div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>{tpl.category || 'Official Form'}</div>
          </div>
        </div>
        <Badge tone={tpl.status === 'active' ? 'green' : 'yellow'}>{tpl.status_label || tpl.status}</Badge>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
        {tpl.description || 'Configurable official document template for property operations.'}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>
          Updated {tpl.updated_at ? new Date(tpl.updated_at).toLocaleDateString() : 'Recently'}
        </span>
        <button onClick={() => onEdit(tpl)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 30, paddingInline: 12, borderRadius: 7,
          border: 'none', background: '#1E40AF', color: '#fff',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.1s',
        }}
          onMouseEnter={(e)=>{(e.currentTarget as HTMLButtonElement).style.background='#1D3FAB'}}
          onMouseLeave={(e)=>{(e.currentTarget as HTMLButtonElement).style.background='#1E40AF'}}
        >
          <Edit3 size={12}/> Edit Template
        </button>
      </div>
    </div>
  )
}

export function DocumentTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({ open: false, title: '', message: '', action: () => {} })

  const admin = isAdmin(user)

  async function loadTemplates() {
    setLoading(true)
    try {
      const result = await templateService.list({ per_page: 100 })
      setTemplates(result.items)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to load document templates.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  function handleOpenEdit(t: DocumentTemplate) {
    setEditingTemplate({ ...t })
  }

  async function handleSaveTemplate() {
    if (!editingTemplate || !editingTemplate.id) return
    setSaving(true)
    setMessage(null)
    try {
      const updated = await templateService.updateContent(editingTemplate.id, editingTemplate)
      setEditingTemplate({ ...updated })
      setMessage({ type: 'success', text: `Template "${updated.name}" saved successfully.` })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save template configuration.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleRestoreDefault() {
    if (!editingTemplate || !editingTemplate.id) return
    setConfirmDialog({
      open: true,
      title: 'Restore Default Template?',
      message: 'Restore this template to its original standard configuration? Custom modifications will be lost.',
      action: async () => {
        setSaving(true)
        try {
          const restored = await templateService.restoreDefault(editingTemplate.id!)
          setEditingTemplate({ ...restored })
          setMessage({ type: 'success', text: `Template "${restored.name}" restored to default.` })
          await loadTemplates()
        } catch (error: unknown) {
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Failed to restore default template.',
          })
        } finally {
          setSaving(false)
        }
      },
    })
  }

  if (!admin) {
    return (
      <div className="p-6">
        <PageHeader title="Document Templates" subtitle="Access restricted." />
        <Alert tone="error">Only system administrators can access Document Template Management.</Alert>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <PageHeader
          title="Document Templates"
          subtitle="Configure official PSA receipts, forms, and certificate templates."
        />
        {editingTemplate && (
          <button
            onClick={() => setEditingTemplate(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 38, paddingInline: 16, borderRadius: 10,
              border: '1px solid #E2E8F0', background: '#fff', color: '#374151',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            <ArrowLeft size={15}/> Back to List
          </button>
        )}
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* Editor / List */}
      {editingTemplate ? (
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 22, minHeight: 640, alignItems: 'start' }}>
          <TemplateEditor
            template={editingTemplate}
            onChange={(u) => setEditingTemplate(u)}
            onSave={() => void handleSaveTemplate()}
            onRestoreDefault={() => void handleRestoreDefault()}
            saving={saving}
          />
          <TemplatePreview template={editingTemplate}/>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748B' }}>
              Official Document Templates ({templates.length})
            </div>
            <span style={{ fontSize: 11.5, color: '#94A3B8' }}>All templates use the centralized template engine</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <Spinner label="Loading document templates..." />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState title="No templates found" description="Run seeders or add your first document template."/>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {templates.map((tpl) => (
                <TemplateCard key={tpl.id} tpl={tpl} onEdit={handleOpenEdit}/>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { confirmDialog.action(); setConfirmDialog({ open:false,title:'',message:'',action:()=>{} }) }}
        onCancel={() => setConfirmDialog({ open:false,title:'',message:'',action:()=>{} })}
      />
    </div>
  )
}
