import { useEffect, useState } from 'react'
import { Badge, Card, EmptyState, Input, Spinner, Table, type Column } from '@/components/ui'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'
import { formatDate } from '@/utils/dateFormat'

interface PermanentIssuanceUserDirectoryProps {
  onSelectUser: (user: IssuanceUserSummary) => void
}

export function PermanentIssuanceUserDirectory({ onSelectUser }: PermanentIssuanceUserDirectoryProps) {
  const [rows, setRows] = useState<IssuanceUserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async (term = search) => {
    setLoading(true)
    try {
      const result = await permanentIssuanceService.listUsers({
        search: term || undefined,
        has_issuances: true,
        per_page: 50,
      })
      setRows(result.items)
    } catch (e) {
      console.error('Failed to load issuance directory:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(search)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const columns: Column<IssuanceUserSummary>[] = [
    {
      key: 'full_name',
      header: 'Employee',
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0F172A]">{r.full_name}</p>
          <p className="text-xs text-[#94A3B8]">{r.employee_number ?? 'No employee number'}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (r) => r.department?.name ?? '—',
    },
    {
      key: 'office',
      header: 'Office',
      render: (r) => r.office?.name ?? '—',
    },
    {
      key: 'roles',
      header: 'Role',
      render: (r) => r.roles?.[0]?.name ?? '—',
    },
    {
      key: 'permanent_issuance_count',
      header: 'Issued Items',
      render: (r) => (
        <Badge tone="blue">{r.permanent_issuance_count ?? 0}</Badge>
      ),
    },
    {
      key: 'latest_issuance_date',
      header: 'Latest Issuance',
      render: (r) => (r.latest_issuance_date ? formatDate(r.latest_issuance_date) : '—'),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => onSelectUser(r)}
          className="text-sm font-semibold text-[#0D47A1] hover:underline"
        >
          View Assets
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <Input
            placeholder="Search by name, employee number, department, or office…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <div className="py-16">
                <EmptyState
                  title="No accountable employees found"
                  description="Employees with permanently issued assets will appear here."
                />
              </div>
            }
          />
        )}
      </Card>
    </div>
  )
}
