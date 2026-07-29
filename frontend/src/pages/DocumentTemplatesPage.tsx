import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from '@/components/ui'
import {
  templateService,
  type DocumentTemplate,
} from '@/services/templateService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'
import { TemplateEditor } from '@/components/templates/TemplateEditor'
import { TemplatePreview } from '@/components/templates/TemplatePreview'
import { FileText, Edit3, ArrowLeft } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Document Templates"
          subtitle="Configure official PSA receipts, forms, and certificate templates."
        />
        {editingTemplate && (
          <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
            <ArrowLeft size={16} className="mr-1.5" /> Back to List
          </Button>
        )}
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* If editing, show Split View: Editor | Preview */}
      {editingTemplate ? (
        <div className="grid gap-6 lg:grid-cols-12 min-h-[640px]">
          <div className="lg:col-span-7 h-full">
            <TemplateEditor
              template={editingTemplate}
              onChange={(updated) => setEditingTemplate(updated)}
              onSave={() => void handleSaveTemplate()}
              onRestoreDefault={() => void handleRestoreDefault()}
              saving={saving}
            />
          </div>
          <div className="lg:col-span-5 h-full min-h-[600px]">
            <TemplatePreview template={editingTemplate} />
          </div>
        </div>
      ) : (
        /* Template List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Official Document Templates ({templates.length})
            </h3>
            <span className="text-xs text-slate-400">All document templates use the centralized template engine</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading document templates..." />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="No templates found"
              description="Run seeders or add your first document template."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <Card key={tpl.id} className="relative transition-all hover:border-[#0D47A1]/40 hover:shadow-md">
                  <div className="flex flex-col h-full justify-between space-y-4 p-1">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0D47A1]">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">{tpl.name}</h4>
                            <p className="text-[11px] text-slate-500">{tpl.category || 'Official Form'}</p>
                          </div>
                        </div>

                        <Badge tone={tpl.status === 'active' ? 'green' : 'yellow'}>
                          {tpl.status_label || tpl.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {tpl.description || 'Configurable official document template for property operations.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        Updated {tpl.updated_at ? new Date(tpl.updated_at).toLocaleDateString() : 'Recently'}
                      </div>

                      <Button size="sm" onClick={() => handleOpenEdit(tpl)}>
                        <Edit3 size={14} className="mr-1" /> Edit Template
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.action()
          setConfirmDialog({ open: false, title: '', message: '', action: () => {} })
        }}
        onCancel={() => setConfirmDialog({ open: false, title: '', message: '', action: () => {} })}
      />
    </div>
  )
}
