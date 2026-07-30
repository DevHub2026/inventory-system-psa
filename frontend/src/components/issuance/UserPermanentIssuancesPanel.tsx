import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { IssuanceUserSummary, PermanentIssuanceAsset } from '@/types/permanentIssuance'
import { formatDate } from '@/utils/dateFormat'

interface UserPermanentIssuancesPanelProps {
  user: IssuanceUserSummary
  onBack?: () => void
}

export function UserPermanentIssuancesPanel({ user, onBack }: UserPermanentIssuancesPanelProps) {
  const [items, setItems] = useState<PermanentIssuanceAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await permanentIssuanceService.getUserAssets(user.id)
        setItems(result.items)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load permanent issuances.')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user.id])

  const columns: Column<PermanentIssuanceAsset>[] = [
    { key: 'asset_name', header: 'Asset Name', render: (r) => r.asset_name },
    {
      key: 'property_number',
      header: 'Property Number',
      render: (r) => r.property_number ?? '—',
    },
    {
      key: 'asset_number',
      header: 'Asset Number',
      render: (r) => r.asset_number ?? '—',
    },
    { key: 'category', header: 'Category', render: (r) => r.category ?? '—' },
    { key: 'office', header: 'Office', render: (r) => r.office ?? '—' },
    {
      key: 'date_issued',
      header: 'Date Issued',
      render: (r) => (r.date_issued ? formatDate(r.date_issued) : '—'),
    },
    { key: 'issued_by', header: 'Issued By', render: (r) => r.issued_by ?? '—' },
    {
      key: 'is_unlinked_holder',
      header: 'Status',
      render: (r) => (
        r.is_unlinked_holder
          ? <Badge tone="yellow">Unlinked holder</Badge>
          : <Badge tone="green">Current</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div>
            {onBack && (
              <Button variant="secondary" size="sm" onClick={onBack} className="mb-3">
                ← Back to Directory
              </Button>
            )}
            <h2 className="text-lg font-bold text-[#0F172A]">{user.full_name}</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {[user.employee_number, user.department?.name, user.office?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
          <Badge tone="blue">{items.length} permanently issued</Badge>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table
            columns={columns}
            rows={items}
            rowKey={(r) => r.asset_id}
            empty={
              <div className="py-16">
                <EmptyState
                  title="No permanently issued assets"
                  description="This employee has no current permanent accountability records."
                />
              </div>
            }
          />
        )}
      </Card>
    </div>
  )
}
