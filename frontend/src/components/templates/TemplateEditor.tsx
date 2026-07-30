import { useState } from 'react'
import { type DocumentTemplate, type SignatureBlock } from '@/services/templateService'
import { PlaceholderPicker } from './PlaceholderPicker'
import { SignatureEditor } from './SignatureEditor'
import { LogoUploader } from './LogoUploader'
import { Layout, Type, FileText, PenTool, Settings, RotateCcw, Save } from 'lucide-react'
import { Button, Input } from '@/components/ui'

interface TemplateEditorProps {
  template: Partial<DocumentTemplate>
  onChange: (updated: Partial<DocumentTemplate>) => void
  onSave: () => void
  onRestoreDefault: () => void
  saving?: boolean
}

type TabKey = 'header' | 'body' | 'footer' | 'signatures' | 'page' | 'typography'

export function TemplateEditor({
  template,
  onChange,
  onSave,
  onRestoreDefault,
  saving = false,
}: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('body')

  const handleBodyInsert = (token: string) => {
    const current = template.body_template || ''
    onChange({ ...template, body_template: current ? `${current} ${token}` : token })
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'body', label: 'Body', icon: FileText },
    { key: 'header', label: 'Header', icon: Layout },
    { key: 'footer', label: 'Footer', icon: PenTool },
    { key: 'signatures', label: 'Signatures', icon: PenTool },
    { key: 'page', label: 'Page Setup', icon: Settings },
    { key: 'typography', label: 'Typography', icon: Type },
  ]

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/80">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{template.name || 'Edit Template'}</h3>
          <p className="text-[11px] text-slate-500">
            Customize header, placeholders, signatures, and page layout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onRestoreDefault} title="Reset to standard PSA preset">
            <RotateCcw size={14} className="mr-1" /> Restore Default
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save size={14} className="mr-1" /> {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/70 px-2 pt-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#0D47A1] border-t-2 border-t-[#0D47A1] shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* HEADER TAB */}
        {activeTab === 'header' && (
          <div className="space-y-4">
            <LogoUploader
              logoUrl={template.logo_url}
              onChange={(url) => onChange({ ...template, logo_url: url })}
            />

            <Input
              label="Organization Name"
              value={template.header_org_name || ''}
              onChange={(e) => onChange({ ...template, header_org_name: e.target.value })}
              placeholder="e.g. PHILIPPINE STATISTICS AUTHORITY"
            />

            <Input
              label="Office Name"
              value={template.header_office_name || ''}
              onChange={(e) => onChange({ ...template, header_office_name: e.target.value })}
              placeholder="e.g. Regional Statistical Services Office"
            />

            <Input
              label="Document Title"
              value={template.header_title || ''}
              onChange={(e) => onChange({ ...template, header_title: e.target.value })}
              placeholder="e.g. PROPERTY BORROW RECEIPT"
            />
          </div>
        )}

        {/* BODY TAB */}
        {activeTab === 'body' && (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Template Body Text
                </label>
                <span className="text-[11px] text-slate-400">Use placeholders to auto-populate data</span>
              </div>

              <textarea
                rows={10}
                value={template.body_template || ''}
                onChange={(e) => onChange({ ...template, body_template: e.target.value })}
                placeholder="Enter template body text here. Use {{placeholder}} tokens for dynamic variables..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 shadow-xs focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
              />
            </div>

            <PlaceholderPicker onInsert={handleBodyInsert} />
          </div>
        )}

        {/* FOOTER TAB */}
        {activeTab === 'footer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Footer Text</label>
              <input
                type="text"
                value={template.footer_text || ''}
                onChange={(e) => onChange({ ...template, footer_text: e.target.value })}
                placeholder="e.g. Official Document — Philippine Statistics Authority"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Footer Notes / Instructions</label>
              <textarea
                rows={3}
                value={template.footer_notes || ''}
                onChange={(e) => onChange({ ...template, footer_notes: e.target.value })}
                placeholder="e.g. Note: Unreturned items after due date are subject to property accountability review."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* SIGNATURES TAB */}
        {activeTab === 'signatures' && (
          <SignatureEditor
            blocks={(template.signature_blocks as SignatureBlock[]) || []}
            onChange={(blocks) => onChange({ ...template, signature_blocks: blocks })}
          />
        )}

        {/* PAGE SETUP TAB */}
        {activeTab === 'page' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Paper Size</label>
                <div className="flex gap-2">
                  {(['A4', 'Letter'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onChange({ ...template, paper_size: size })}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        template.paper_size === size
                          ? 'border-[#0D47A1] bg-[#EFF6FF] text-[#0D47A1]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Orientation</label>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as const).map((orient) => (
                    <button
                      key={orient}
                      type="button"
                      onClick={() => onChange({ ...template, orientation: orient })}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${
                        template.orientation === orient
                          ? 'border-[#0D47A1] bg-[#EFF6FF] text-[#0D47A1]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {orient}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Page Margins (mm)</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['margin_top', 'margin_bottom', 'margin_left', 'margin_right'] as const).map((mKey) => (
                  <div key={mKey}>
                    <label className="block text-[11px] text-slate-500 capitalize mb-1">
                      {mKey.replace('margin_', '')}
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={template[mKey] ?? 25}
                      onChange={(e) => onChange({ ...template, [mKey]: parseInt(e.target.value) || 25 })}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0D47A1] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Font Family</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Arial', 'Calibri', 'Times New Roman'] as const).map((font) => (
                  <button
                    key={font}
                    type="button"
                    style={{ fontFamily: font }}
                    onClick={() => onChange({ ...template, font_family: font })}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                      template.font_family === font
                        ? 'border-[#0D47A1] bg-[#EFF6FF] text-[#0D47A1]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Font Size (pt)</label>
                <div className="flex gap-2">
                  {([10, 11, 12, 14] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onChange({ ...template, font_size: size })}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all ${
                        template.font_size === size
                          ? 'border-[#0D47A1] bg-[#EFF6FF] text-[#0D47A1]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Text Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => onChange({ ...template, text_alignment: align })}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold capitalize transition-all ${
                        template.text_alignment === align
                          ? 'border-[#0D47A1] bg-[#EFF6FF] text-[#0D47A1]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Versioning / Modified footer info */}
      {template.updated_at && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Version {template.version || '1.0'}</span>
          <span>
            Last Modified by <strong className="text-slate-700">{template.updated_by_name || 'System Administrator'}</strong> on{' '}
            {new Date(template.updated_at).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}
