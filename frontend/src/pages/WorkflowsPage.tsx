import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, Input, Badge, Table, EmptyState, Spinner, Alert, type Column } from '@/components/ui'
import { workflowService, type ModuleOption } from '@/services/workflowService'
import type { Workflow } from '@/types'
import { WorkflowEditorModal } from '@/components/workflows/WorkflowEditorModal'
import { WorkflowVersionHistoryModal } from '@/components/workflows/WorkflowVersionHistoryModal'
import {
  Plus,
  Search,
  Copy,
  Archive,
  RotateCcw,
  History,
  Edit,
  Power,
} from 'lucide-react'

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [modules, setModules] = useState<ModuleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyWorkflow, setHistoryWorkflow] = useState<{ id: number; name: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [mRes, wRes] = await Promise.all([
        workflowService.getModules(),
        workflowService.list({
          search: search.trim() || undefined,
          module_type: selectedModule || undefined,
          is_archived: showArchived ? 1 : 0,
        }),
      ])
      setModules(mRes.modules)
      setWorkflows(wRes.items)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load workflows.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [search, selectedModule, showArchived])

  const handleDuplicate = async (w: Workflow) => {
    try {
      await workflowService.duplicate(w.id)
      setMessage({ type: 'success', text: `Workflow "${w.name}" duplicated successfully.` })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to duplicate workflow.' })
    }
  }

  const handleArchiveToggle = async (w: Workflow) => {
    try {
      if (w.is_archived) {
        await workflowService.restore(w.id)
        setMessage({ type: 'success', text: `Workflow "${w.name}" restored.` })
      } else {
        await workflowService.archive(w.id)
        setMessage({ type: 'success', text: `Workflow "${w.name}" archived.` })
      }
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to archive/restore workflow.' })
    }
  }

  const handleToggleActive = async (w: Workflow) => {
    try {
      await workflowService.toggleStatus(w.id)
      setMessage({ type: 'success', text: `Workflow status updated.` })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to toggle status.' })
    }
  }

  const columns: Column<Workflow>[] = [
    {
      key: 'name',
      header: 'Workflow Name',
      render: (w) => (
        <div>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            {w.name}
            {w.current_version && (
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                v{w.current_version.version_number}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{w.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'module_type',
      header: 'Target Module',
      render: (w) => {
        const mod = modules.find((m) => m.value === w.module_type)
        return <Badge tone="blue">{mod?.label || w.module_type}</Badge>
      },
    },
    {
      key: 'approval_levels',
      header: 'Sequence',
      render: (w) => {
        const levels = w.current_version?.approval_levels || []
        if (levels.length === 0) return <span className="text-xs text-slate-400 italic">No levels</span>
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-xs text-slate-700">{levels.length} Level(s):</span>
            <span className="text-xs text-slate-500 truncate max-w-[200px]">
              {levels.map((l) => l.name).join(' → ')}
            </span>
          </div>
        )
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (w) => {
        if (w.is_archived) return <Badge tone="gray">Archived</Badge>
        return w.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="yellow">Inactive</Badge>
      },
    },
    {
      key: 'updated_at',
      header: 'Last Modified',
      render: (w) => (
        <span className="font-mono text-xs text-slate-500">
          {new Date(w.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (w) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => {
              setEditingWorkflow(w)
              setEditorOpen(true)
            }}
            className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Edit Workflow"
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              setHistoryWorkflow({ id: w.id, name: w.name })
              setHistoryOpen(true)
            }}
            className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Version History"
          >
            <History size={16} />
          </button>

          <button
            type="button"
            onClick={() => void handleDuplicate(w)}
            className="p-1.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Duplicate"
          >
            <Copy size={16} />
          </button>

          <button
            type="button"
            onClick={() => void handleToggleActive(w)}
            className={`p-1.5 rounded-lg transition-colors ${
              w.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={w.is_active ? 'Disable Workflow' : 'Enable Workflow'}
          >
            <Power size={16} />
          </button>

          <button
            type="button"
            onClick={() => void handleArchiveToggle(w)}
            className="p-1.5 text-slate-600 hover:text-red-700 rounded-lg hover:bg-slate-100 transition-colors"
            title={w.is_archived ? 'Restore' : 'Archive'}
          >
            {w.is_archived ? <RotateCcw size={16} /> : <Archive size={16} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Approval Workflows"
          subtitle="Configure multi-level approval workflows, assigned roles, and version history."
        />
        <Button
          onClick={() => {
            setEditingWorkflow(null)
            setEditorOpen(true)
          }}
        >
          <Plus size={16} className="mr-1.5" /> Create Workflow
        </Button>
      </div>

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows by name or description..."
              className="pl-9"
            />
          </div>

          <div className="w-56">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-archived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300 text-[#0D47A1]"
          />
          <label htmlFor="show-archived" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Show Archived
          </label>
        </div>
      </div>

      {/* Workflow Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner label="Loading workflow configurations..." />
          </div>
        ) : workflows.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No Workflows Found"
              description="No workflow configurations match your filter parameters."
            />
          </div>
        ) : (
          <Table columns={columns} rows={workflows} rowKey={(w) => w.id} />
        )}
      </div>

      {/* Editor Modal */}
      <WorkflowEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={loadData}
        workflowToEdit={editingWorkflow}
      />

      {/* Version History Modal */}
      <WorkflowVersionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        workflowId={historyWorkflow?.id || null}
        workflowName={historyWorkflow?.name}
      />
    </div>
  )
}
