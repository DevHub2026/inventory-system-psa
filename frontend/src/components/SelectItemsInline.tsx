import { useEffect, useState } from 'react'
import { assetService } from '@/services/assetService'
import type { Asset } from '@/types'

export function SelectItemsInline({ initialSelected = [], onChange, placeholder = 'Search assets...' }: { initialSelected?: number[]; onChange: (ids: number[]) => void; placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number[]>(initialSelected || [])

  useEffect(() => { setSelected(initialSelected || []) }, [initialSelected])

  useEffect(() => {
    let cancelled = false
    const doSearch = async () => {
      setLoading(true)
      try {
        const res = await assetService.list({ per_page: 50, search: query || undefined })
        if (!cancelled) setResults(res.items)
      } catch (err) {
        console.error('search failed', err)
      } finally { if (!cancelled) setLoading(false) }
    }
    if (query.trim() === '') {
      // show first page
      void (async () => {
        setLoading(true)
        try {
          const r = await assetService.list({ per_page: 50 })
          if (!cancelled) setResults(r.items)
        } catch {
          if (!cancelled) setResults([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    } else {
      const t = setTimeout(() => { void doSearch() }, 250)
      return () => clearTimeout(t)
    }
    return () => { cancelled = true }
  }, [query])

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      onChange(next)
      return next
    })
  }

  const selectAllFiltered = () => {
    const ids = results.map(r => r.id)
    setSelected(prev => {
      const union = Array.from(new Set([...prev, ...ids]))
      onChange(union)
      return union
    })
  }

  return (
    <div>
      <input placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <div style={{ maxHeight: 220, overflow: 'auto' }}>
        {loading ? <div style={{ padding: 8, color: '#64748B' }}>Loading...</div> : null}
        {results.map(r => (
          <label key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderBottom: '1px solid #F1F5F9' }}>
            <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ marginLeft: 'auto', color: '#64748B', fontFamily: 'monospace' }}>{r.asset_number ?? `#${r.id}`}</div>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={selectAllFiltered} style={{ border: '1px solid #E2E8F0', background: '#fff', padding: '6px 8px', borderRadius: 8 }}>Select All</button>
      </div>
    </div>
  )
}
