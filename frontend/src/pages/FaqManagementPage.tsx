import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/utils/roleHelpers'
import { faqService, type FaqPayload } from '@/services/faqService'
import { roleService, type Role } from '@/services/roleService'
import { normalizeFaq, type FAQItem } from '@/help/faq'
import { useNavigate } from 'react-router-dom'

const VERIFIED_ROUTE_OPTIONS = [
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Borrowings', value: '/borrowings' },
  { label: 'Inventory', value: '/inventory' },
  { label: 'Assets', value: '/assets' },
  { label: 'Reservations', value: '/reservations' },
  { label: 'QR Scanner', value: '/qr' },
  { label: 'Reports', value: '/reports' },
  { label: 'System Setup', value: '/system-setup' },
  { label: 'Documentation', value: '/documentation' },
  { label: 'Users', value: '/users' },
  { label: 'Roles', value: '/roles' },
  { label: 'Extension Requests', value: '/extension-requests' },
] as const

interface FaqDraft {
  id: string
  question: string
  answer: string
  category: string
  selectedRoles: string[]
  keywords: string
  destination: string
  destinationLabel: string
  active: boolean
  actions: Array<{ label: string; target: string }>
}

const emptyDraft = (): FaqDraft => ({
  id: '',
  question: '',
  answer: '',
  category: 'General',
  selectedRoles: [],
  keywords: '',
  destination: '',
  destinationLabel: '',
  active: true,
  actions: [],
})

export function FaqManagementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const canManage = hasPermission(user, 'manage faqs')

  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | number | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<FaqDraft>(emptyDraft())
  const [formError, setFormError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null)

  const loadAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const [faqList, roleList] = await Promise.all([
        faqService.getAdminFaqs(),
        roleService.getRoles({ per_page: 100 }).then((p) => p.items),
      ])
      setFaqs(faqList)
      setRoles(roleList)
    } catch {
      setError('Failed to load FAQ data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!canManage) {
      navigate('/dashboard', { replace: true })
      return
    }
    void loadAll()
  }, [canManage, navigate])

  const categories = useMemo(
    () => Array.from(new Set(faqs.map((f) => f.category || 'General'))),
    [faqs],
  )

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const matchCat = !categoryFilter || (f.category || 'General') === categoryFilter
      if (!matchCat) return false
      if (!search) return true
      const q = search.toLowerCase()
      return [f.question, f.answer, f.category || '', (f.keywords || []).join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [faqs, search, categoryFilter])

  const openCreate = () => {
    setDraft(emptyDraft())
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: FAQItem) => {
    setDraft({
      id: String(item.id),
      question: item.question,
      answer: item.answer,
      category: item.category || 'General',
      selectedRoles: Array.isArray(item.roles) ? [...item.roles] : [],
      keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : '',
      destination: item.destinationRoute || item.destination || item.actions?.[0]?.target || '',
      destinationLabel: item.destinationLabel || item.actions?.[0]?.label || 'Open page',
      active: item.active !== false,
      actions: (item.actions || []).map((a) => ({ label: a.label, target: a.target })),
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormError(null)
  }

  const toggleRole = useCallback((roleName: string) => {
    setDraft((d) => ({
      ...d,
      selectedRoles: d.selectedRoles.includes(roleName)
        ? d.selectedRoles.filter((r) => r !== roleName)
        : [...d.selectedRoles, roleName],
    }))
  }, [])

  const buildPayload = (): FaqPayload | null => {
    const question = draft.question.trim()
    const answer = draft.answer.trim()

    if (!question) { setFormError('Question is required.'); return null }
    if (!answer || answer.length < 10) { setFormError('Answer must be at least 10 characters.'); return null }
    if (!draft.destination.trim() && draft.actions.length === 0) {
      setFormError('Select a destination route or add at least one quick action.')
      return null
    }

    const primaryLabel = draft.destinationLabel.trim() || 'Open page'
    const destinationRoute = draft.destination.trim()
    const extraActions = draft.actions
      .filter((a) => a.label.trim() && a.target.trim())
      .map((a) => ({ label: a.label.trim(), type: 'route' as const, target: a.target.trim() }))

    const destinationAction = destinationRoute
      ? { label: primaryLabel, type: 'route' as const, target: destinationRoute }
      : null
    const finalActions = destinationAction
      ? [destinationAction, ...extraActions.filter((a) => a.target !== destinationRoute)]
      : extraActions

    return {
      question,
      answer,
      category: draft.category || 'General',
      roles: draft.selectedRoles,
      keywords: draft.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      destination: destinationRoute || finalActions[0]?.target || '',
      destinationLabel: primaryLabel,
      actions: finalActions,
      active: draft.active,
    }
  }

  const saveFaq = async () => {
    const payload = buildPayload()
    if (!payload) return

    try {
      setSaving(true)
      setFormError(null)
      const saved = draft.id
        ? await faqService.updateFaq(draft.id, payload)
        : await faqService.createFaq(payload)
      const normalized = normalizeFaq(saved)
      setFaqs((current) =>
        draft.id
          ? current.map((f) => (String(f.id) === draft.id ? normalized : f))
          : [normalized, ...current],
      )
      closeModal()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: FAQItem) => {
    try {
      const saved = await faqService.updateFaq(item.id, { active: item.active === false })
      setFaqs((current) =>
        current.map((f) => (String(f.id) === String(item.id) ? normalizeFaq(saved) : f)),
      )
    } catch {
      setError('Failed to update FAQ status.')
    }
  }

  const confirmDelete = (id: string | number) => setConfirmDeleteId(id)

  const executDelete = async () => {
    if (confirmDeleteId == null) return
    try {
      setDeleting(confirmDeleteId)
      await faqService.deleteFaq(confirmDeleteId)
      setFaqs((current) => current.filter((f) => String(f.id) !== String(confirmDeleteId)))
    } catch {
      setError('Failed to delete FAQ entry.')
    } finally {
      setDeleting(null)
      setConfirmDeleteId(null)
    }
  }

  if (!canManage) return null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>FAQ Management</h1>
          <p style={{ color: '#475569', marginTop: 4, fontSize: 14 }}>
            Manage help FAQ entries visible to users across the application.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add FAQ</Button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: 14 }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C' }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          aria-label="Search FAQs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search question, answer, keywords…"
          style={{ flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14 }}
        />
        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14 }}
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: 13, paddingLeft: 4 }}>
          {filtered.length} of {faqs.length} entries
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading FAQs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', border: '1px dashed #CBD5E1', borderRadius: 10 }}>
          {faqs.length === 0 ? 'No FAQ entries yet. Click "+ Add FAQ" to create the first one.' : 'No entries match your filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((item) => (
            <div
              key={String(item.id)}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                background: item.active === false ? '#F8FAFC' : '#FFFFFF',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>
                  {item.question}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ background: '#EEF2FF', color: '#3730A3', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                    {item.category || 'General'}
                  </span>
                  <span style={{
                    background: item.active === false ? '#FEF2F2' : '#F0FDF4',
                    color: item.active === false ? '#B91C1C' : '#15803D',
                    borderRadius: 6, padding: '2px 8px', fontWeight: 600,
                  }}>
                    {item.active === false ? 'Inactive' : 'Active'}
                  </span>
                  {(item.roles || []).length > 0 && (
                    <span style={{ color: '#94A3B8' }}>
                      Roles: {(item.roles || []).join(', ')}
                    </span>
                  )}
                  {(item.roles || []).length === 0 && (
                    <span style={{ color: '#94A3B8' }}>Visible to all roles</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                  {item.answer}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => openEdit(item)}
                  style={rowBtn('#EEF2FF', '#3730A3')}
                >
                  Edit
                </button>
                <button
                  onClick={() => void toggleActive(item)}
                  style={rowBtn(item.active === false ? '#F0FDF4' : '#FEF9C3', item.active === false ? '#15803D' : '#92400E')}
                >
                  {item.active === false ? 'Activate' : 'Deactivate'}
                </button>
                <button
                  onClick={() => confirmDelete(item.id)}
                  disabled={deleting === item.id}
                  style={rowBtn('#FEF2F2', '#B91C1C')}
                >
                  {deleting === item.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        open={modalOpen}
        title={draft.id ? 'Edit FAQ' : 'Add FAQ'}
        onClose={closeModal}
        maxWidth={780}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={() => void saveFaq()} disabled={saving}>
              {saving ? 'Saving…' : draft.id ? 'Save Changes' : 'Create FAQ'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>
          {formError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: 14 }}>
              {formError}
            </div>
          )}

          <label style={labelWrap}>
            <span style={labelText}>Question <span style={{ color: '#B91C1C' }}>*</span></span>
            <input
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              style={fieldSt}
              placeholder="e.g. How do I borrow an item?"
            />
          </label>

          <label style={labelWrap}>
            <span style={labelText}>Answer <span style={{ color: '#B91C1C' }}>*</span></span>
            <textarea
              value={draft.answer}
              onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
              rows={5}
              style={{ ...fieldSt, resize: 'vertical' }}
              placeholder="Provide a clear, helpful answer (min. 10 characters)"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 140px), 1fr))', gap: 12 }}>
            <label style={labelWrap}>
              <span style={labelText}>Category</span>
              <input
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                style={fieldSt}
                placeholder="General"
              />
            </label>

            <label style={labelWrap}>
              <span style={labelText}>Keywords <span style={{ color: '#94A3B8', fontWeight: 400 }}>(comma-separated)</span></span>
              <input
                value={draft.keywords}
                onChange={(e) => setDraft((d) => ({ ...d, keywords: e.target.value }))}
                style={fieldSt}
                placeholder="borrow, due date, return"
              />
            </label>
          </div>

          {/* Applicable roles — checkbox list from actual DB roles */}
          <div>
            <div style={labelText}>Applicable Roles</div>
            <div style={{ color: '#64748B', fontSize: 12, marginBottom: 8 }}>
              Leave all unchecked to make this FAQ visible to every role.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: 6 }}>
              {roles.map((role) => (
                <label
                  key={role.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, border: `1px solid ${draft.selectedRoles.includes(role.name) ? '#6366F1' : '#E2E8F0'}`, background: draft.selectedRoles.includes(role.name) ? '#EEF2FF' : '#FAFAFA', fontSize: 13, fontWeight: draft.selectedRoles.includes(role.name) ? 700 : 400 }}
                >
                  <input
                    type="checkbox"
                    checked={draft.selectedRoles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                    style={{ accentColor: '#6366F1' }}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 140px), 1fr))', gap: 12 }}>
            <label style={labelWrap}>
              <span style={labelText}>Destination route <span style={{ color: '#B91C1C' }}>*</span></span>
              <select
                value={draft.destination}
                onChange={(e) => setDraft((d) => ({ ...d, destination: e.target.value }))}
                style={fieldSt}
              >
                <option value="">Select a route…</option>
                {VERIFIED_ROUTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label style={labelWrap}>
              <span style={labelText}>Destination label</span>
              <input
                value={draft.destinationLabel}
                onChange={(e) => setDraft((d) => ({ ...d, destinationLabel: e.target.value }))}
                style={fieldSt}
                placeholder="Open Borrowings"
              />
            </label>
          </div>

          {/* Quick actions */}
          <div>
            <div style={labelText}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {draft.actions.map((action, idx) => (
                <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <input
                    value={action.label}
                    onChange={(e) => setDraft((d) => ({ ...d, actions: d.actions.map((a, i) => i === idx ? { ...a, label: e.target.value } : a) }))}
                    placeholder="Open Borrowings"
                    style={{ ...fieldSt, flex: 1, minWidth: 120 }}
                  />
                  <select
                    value={action.target}
                    onChange={(e) => setDraft((d) => ({ ...d, actions: d.actions.map((a, i) => i === idx ? { ...a, target: e.target.value } : a) }))}
                    style={{ ...fieldSt, flex: 1, minWidth: 120 }}
                  >
                    <option value="">Select route…</option>
                    {VERIFIED_ROUTE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setDraft((d) => ({ ...d, actions: d.actions.filter((_, i) => i !== idx) }))}
                    style={rowBtn('#FEF2F2', '#B91C1C')}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDraft((d) => ({ ...d, actions: [...d.actions, { label: '', target: '' }] }))}
                style={{ ...rowBtn('#EEF2FF', '#3730A3'), width: 'fit-content' }}
              >
                + Add action
              </button>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              style={{ accentColor: '#6366F1', width: 16, height: 16 }}
            />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Published (visible to users)</span>
          </label>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal
        open={confirmDeleteId != null}
        title="Delete FAQ"
        onClose={() => setConfirmDeleteId(null)}
        maxWidth={420}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button onClick={() => void executDelete()} disabled={deleting != null}>
              {deleting != null ? 'Deleting…' : 'Delete FAQ'}
            </Button>
          </div>
        }
      >
        <p style={{ color: '#334155', margin: 0 }}>
          This will soft-delete the FAQ entry. It will no longer appear in the Help &amp; FAQ hub.
          The record can be recovered from the database if needed.
        </p>
      </Modal>
    </div>
  )
}

const labelWrap: React.CSSProperties = { display: 'grid', gap: 4 }
const labelText: React.CSSProperties = { fontWeight: 700, fontSize: 14, color: '#1E293B' }
const fieldSt: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  background: '#fff',
  color: '#0F172A',
  fontFamily: 'inherit',
  fontSize: 14,
}
const rowBtn = (bg: string, color: string): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: `1px solid ${bg === '#FFFFFF' ? '#E2E8F0' : bg}`,
  background: bg,
  color,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'inherit',
})
