import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Pagination,
  SearchBar,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { Asset } from '@/types'
import { assetStatusTone } from '@/utils/statusTone'

export function AssetPage() {
  const [rows, setRows] = useState<Asset[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load(nextPage = page) {
    setLoading(true)
    try {
      const result = await assetService.list({
        page: nextPage,
        search: search || undefined,
        status: status || undefined,
      })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const columns: Column<Asset>[] = useMemo(
    () => [
      { key: 'asset_number', header: 'Asset Code', render: (row) => row.asset_number },
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={assetStatusTone(row.status)}>{row.status}</Badge>,
      },
      { key: 'location', header: 'Location', render: (row) => row.location ?? '—' },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="secondary" onClick={() => setMessage(`View asset ${row.asset_number}`)}>
              View
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMessage(`Edit asset ${row.asset_number}`)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteId(row.id)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Assets</h1>
        <p className="text-sm text-gray-500">Connected to GET /api/v1/assets when backend is available.</p>
      </div>

      {message && (
        <Alert tone="info" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <SearchBar
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(1)
            }}
          />
          <div className="flex w-full max-w-xs gap-2">
            <Dropdown
              options={[
                { label: 'Available', value: 'AVAILABLE' },
                { label: 'Borrowed', value: 'BORROWED' },
                { label: 'Reserved', value: 'RESERVED' },
                { label: 'Maintenance', value: 'MAINTENANCE' },
              ]}
              placeholder="All statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <Button variant="secondary" onClick={() => void load(1)}>
              Search
            </Button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            <Table
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No assets found" />}
            />
            <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void load(p)} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete asset"
        message="Soft-delete / archive this asset? This calls DELETE /api/v1/assets/{asset}."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return
          void assetService.remove(deleteId).then(() => {
            setDeleteId(null)
            setMessage('Asset delete requested.')
            void load(page)
          })
        }}
      />
    </div>
  )
}
