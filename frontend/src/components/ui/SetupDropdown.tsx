import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Search, ChevronDown, Check, X } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { setupService, type SetupPayload, type SetupRecord, type SetupResource } from '@/services/setupService'

interface Option {
  label: string
  value: string | number
  raw?: SetupRecord
}

interface SetupDropdownProps {
  label?: string
  resource: SetupResource
  options: Option[]
  value?: string | number | null
  placeholder?: string
  disabled?: boolean
  onChange: (value: number | null) => void
  onRefreshNeeded?: () => Promise<void> | void
  needsOffice?: boolean
  currentOfficeId?: number | null
  codeLabel?: string
}

const RESOURCE_LABELS: Record<SetupResource, string> = {
  'asset-categories': 'Asset Category',
  'offices': 'Office',
  'locations': 'Location',
  'manufacturers': 'Manufacturer',
  'departments': 'Department',
}

export function SetupDropdown({
  label,
  resource,
  options,
  value,
  placeholder = 'Select…',
  disabled = false,
  onChange,
  onRefreshNeeded,
  needsOffice = false,
  currentOfficeId = null,
  codeLabel,
}: SetupDropdownProps) {
  const [open, setOpen]             = useState(false)
  const [search, setSearch]         = useState('')
  const containerRef                = useRef<HTMLDivElement>(null)

  // Quick Add / Quick Edit Modal state
  const [addModalOpen, setAddModalOpen]   = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving]               = useState(false)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)

  const [form, setForm] = useState<SetupPayload>({
    name: '',
    code: '',
    description: '',
    office_id: currentOfficeId,
    is_active: true,
  })

  const selectedOpt = options.find((o) => String(o.value) === String(value))
  const displayLabel = selectedOpt?.label ?? placeholder

  /* Close dropdown when clicking outside */
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  /* Reset search filter when dropdown closes */
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase().trim())
  )

  /* Open Quick Add */
  const handleOpenAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setErrorMsg(null)
    setForm({
      name: '',
      code: '',
      description: '',
      office_id: currentOfficeId,
      is_active: true,
    })
    setAddModalOpen(true)
  }

  /* Open Quick Edit */
  const handleOpenEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedOpt) return
    setErrorMsg(null)
    const rec = selectedOpt.raw
    setForm({
      name: rec?.name ?? selectedOpt.label,
      code: rec?.code ?? '',
      description: rec?.description ?? '',
      office_id: rec?.office_id ?? currentOfficeId,
      is_active: rec?.is_active !== false,
    })
    setEditModalOpen(true)
  }

  /* Submit Quick Add */
  const handleSaveNew = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const payload: SetupPayload = {
        name: form.name.trim(),
        code: resource === 'manufacturers' ? undefined : form.code?.trim() || null,
        description: form.description?.trim() || null,
        office_id: needsOffice ? (form.office_id ?? currentOfficeId) : undefined,
        is_active: form.is_active,
      }
      const newRec = await setupService.create(resource, payload)
      setAddModalOpen(false)
      if (onRefreshNeeded) await onRefreshNeeded()
      onChange(newRec.id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create record.')
    } finally {
      setSaving(false)
    }
  }

  /* Submit Quick Edit */
  const handleSaveEdit = async () => {
    if (!selectedOpt || !form.name.trim()) return
    setSaving(true)
    setErrorMsg(null)
    try {
      const recordId = Number(selectedOpt.value)
      const payload: SetupPayload = {
        name: form.name.trim(),
        code: resource === 'manufacturers' ? undefined : form.code?.trim() || null,
        description: form.description?.trim() || null,
        office_id: needsOffice ? (form.office_id ?? currentOfficeId) : undefined,
        is_active: form.is_active,
      }
      await setupService.update(resource, recordId, payload)
      setEditModalOpen(false)
      if (onRefreshNeeded) await onRefreshNeeded()
      onChange(recordId)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update record.')
    } finally {
      setSaving(false)
    }
  }

  const titleName = RESOURCE_LABELS[resource] ?? 'Record'

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">
          {label}
        </label>
      )}

      {/* Trigger Row */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`flex h-11 flex-1 items-center justify-between rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15 ${
            disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400' : 'text-[#1F2937]'
          }`}
        >
          <span className={selectedOpt ? 'font-medium text-[#1F2937]' : 'text-slate-400'}>
            {displayLabel}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {/* Quick Add (+) Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleOpenAdd}
          title={`Add new ${titleName}`}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] text-[#0D47A1] shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors hover:border-[#0D47A1] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
        </button>

        {/* Quick Edit (✏️) Button */}
        <button
          type="button"
          disabled={disabled || !selectedOpt}
          onClick={handleOpenEdit}
          title={selectedOpt ? `Edit ${titleName}` : `Select a ${titleName} to edit`}
          className={`flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors ${
            selectedOpt && !disabled
              ? 'bg-[#F8FAFC] text-[#475569] hover:border-[#475569] hover:bg-slate-100 hover:text-slate-900'
              : 'cursor-not-allowed bg-slate-50 text-slate-300'
          }`}
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* Searchable Dropdown Popup */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[220px] overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white shadow-lg">
          <div className="flex items-center border-b border-[#F1F5F9] px-3 py-2">
            <Search size={14} className="mr-2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${titleName.toLowerCase()}s...`}
              className="w-full bg-transparent text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching {titleName.toLowerCase()}s found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value === '' ? null : Number(opt.value))
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF] font-semibold text-[#0B3D91]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#0B3D91]" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      <Modal
        open={addModalOpen}
        title={`Add ${titleName}`}
        onClose={() => setAddModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveNew()} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={`Enter ${titleName.toLowerCase()} name`}
          />
          {resource !== 'manufacturers' && (
            <Input
              label={codeLabel ?? `${titleName} Code`}
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. CODE-01"
            />
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">
              Description
            </label>
            <textarea
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-3 text-[14px] text-[#1F2937] shadow-[0_1px_2px_rgba(0,0,0,.05)] focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter description..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[#0B3D91] cursor-pointer"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>
        </div>
      </Modal>

      {/* Quick Edit Modal */}
      <Modal
        open={editModalOpen}
        title={`Edit ${titleName}`}
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {resource !== 'manufacturers' && (
            <Input
              label={codeLabel ?? `${titleName} Code`}
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">
              Description
            </label>
            <textarea
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-3 text-[14px] text-[#1F2937] shadow-[0_1px_2px_rgba(0,0,0,.05)] focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[#0B3D91] cursor-pointer"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
