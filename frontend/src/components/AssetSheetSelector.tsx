import { useEffect, useState } from 'react'
import { Modal, Button, Spinner } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { Asset } from '@/types'

export function AssetSheetSelector({ open, onClose, onConfirm, initialSelected = [] }: { open: boolean; onClose: () => void; onConfirm: (ids: number[]) => void; initialSelected?: number[] }) {
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [selected, setSelected] = useState<number[]>(initialSelected)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    assetService.list({ per_page: 200 }).then(res => {
      setAssets(res.items)
    }).finally(() => setLoading(false))
  }, [open])

  useEffect(() => { setSelected(initialSelected) }, [initialSelected])

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <Modal open={open} title="Select items for sheet" onClose={onClose} maxWidth={720} footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={async () => {
          try {
            setLoading(true)
            await onConfirm(selected)
          } finally {
            setLoading(false)
            onClose()
          }
        }} disabled={loading}>
          {loading ? 'Applying…' : 'Use Selection'}
        </Button>
      </>
    }>
      <div style={{ minHeight: 200 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {assets.map(a => (
              <label key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #E6EEF8', padding: 10, borderRadius: 8, background: selected.includes(a.id) ? '#F1F7FF' : '#fff', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#64748B' }}>{a.asset_number ?? `#${a.id}`}</div>
              </label>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
