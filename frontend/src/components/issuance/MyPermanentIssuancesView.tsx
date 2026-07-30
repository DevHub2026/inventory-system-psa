import { useEffect, useState } from 'react'
import { Alert, Badge, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { PermanentIssuanceAsset } from '@/types/permanentIssuance'
import { formatDate } from '@/utils/dateFormat'

export function MyPermanentIssuancesView() {
  const { user } = useAuth()
  const [items, setItems] = useState<PermanentIssuanceAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await permanentIssuanceService.getUserAssets(user.id)
        setItems(result.items)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load your issued assets.')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.id])

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
      key: 'status',
      header: 'Status',
      render: (r) => (
        r.is_unlinked_holder
          ? <Badge tone="yellow">Unlinked record</Badge>
          : <Badge tone="green">Current</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
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
                  description="Assets permanently issued to you will appear here."
                />
              </div>
            }
          />
        )}
      </Card>
    </div>
  )
}
