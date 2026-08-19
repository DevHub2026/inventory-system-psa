import React, { useEffect, useState } from 'react'
import { SetupDropdown } from '@/components/ui/SetupDropdown'
import { IssuanceUserSearchSelect } from '@/components/issuance/IssuanceUserSearchSelect'
import { Button } from '@/components/ui'
import type { SetupRecord } from '@/services/setupService'

interface Props {
  search: string
  setSearch: (v: string) => void
  onSearchKeyDown?: (e: React.KeyboardEvent) => void

  statusFilter: string
  setStatusFilter: (v: string) => void

  assetCategoryId: number | null
  setAssetCategoryId: (v: number | null) => void

  officeId: number | null
  setOfficeId: (v: number | null) => void

  locationId: number | null
  setLocationId: (v: number | null) => void

  manufacturerId: number | null
  setManufacturerId: (v: number | null) => void

  assignedUserId: number | null
  setAssignedUserId: (v: number | null) => void

  createdFrom: string | null
  setCreatedFrom: (v: string | null) => void

  createdTo: string | null
  setCreatedTo: (v: string | null) => void

  orderBy: string | null
  setOrderBy: (v: string | null) => void
  orderDir: 'ASC' | 'DESC' | null
  setOrderDir: (v: 'ASC' | 'DESC' | null) => void

  onApplyFilters: () => void
  onClearFilters: () => void

  assetCategories?: SetupRecord[]
  manufacturers?: SetupRecord[]
  offices?: SetupRecord[]
  locations?: SetupRecord[]
}

export function InventoryFilterBar({
  search, setSearch, onSearchKeyDown,
  statusFilter, setStatusFilter,
  assetCategoryId, setAssetCategoryId,
  officeId, setOfficeId,
  locationId, setLocationId,
  manufacturerId, setManufacturerId,
  assignedUserId, setAssignedUserId,
  createdFrom, setCreatedFrom,
  createdTo, setCreatedTo,
  orderBy, setOrderBy, orderDir, setOrderDir,
  onApplyFilters, onClearFilters,
  assetCategories = [], manufacturers = [], offices = [], locations = [],
}: Props) {
  const mapOptions = (arr: SetupRecord[]) => arr.map((r) => ({ label: r.name, value: r.id, raw: r }))

  const [open, setOpen] = useState(false)

  // Local advanced filter state (only applied when user clicks Apply)
  const [assetCategoryLocal, setAssetCategoryLocal] = useState<number | null>(assetCategoryId ?? null)
  const [officeLocal, setOfficeLocal] = useState<number | null>(officeId ?? null)
  const [locationLocal, setLocationLocal] = useState<number | null>(locationId ?? null)
  const [manufacturerLocal, setManufacturerLocal] = useState<number | null>(manufacturerId ?? null)
  const [assignedUserLocal, setAssignedUserLocal] = useState<number | null>(assignedUserId ?? null)
  const [createdFromLocal, setCreatedFromLocal] = useState<string | null>(createdFrom ?? null)
  const [createdToLocal, setCreatedToLocal] = useState<string | null>(createdTo ?? null)
  const [orderByLocal, setOrderByLocal] = useState<string | null>(orderBy ?? null)
  const [orderDirLocal, setOrderDirLocal] = useState<'ASC'|'DESC' | null>(orderDir ?? null)

  // Initialize local advanced-filter state when the panel opens.
  // Intentionally run only when 'open' changes so user edits are not overwritten while the panel is open.
  useEffect(() => {
    if (open) {
      // initialize locals from props when opening
      setAssetCategoryLocal(assetCategoryId ?? null)
      setOfficeLocal(officeId ?? null)
      setLocationLocal(locationId ?? null)
      setManufacturerLocal(manufacturerId ?? null)
      setAssignedUserLocal(assignedUserId ?? null)
      setCreatedFromLocal(createdFrom ?? null)
      setCreatedToLocal(createdTo ?? null)
      setOrderByLocal(orderBy ?? null)
      setOrderDirLocal(orderDir ?? null)
    }
  }, [open, assetCategoryId, officeId, locationId, manufacturerId, assignedUserId, createdFrom, createdTo, orderBy, orderDir])

  const applyFilters = () => {
    // push local state to parent setters then call onApplyFilters
    setAssetCategoryId(assetCategoryLocal)
    setOfficeId(officeLocal)
    setLocationId(locationLocal)
    setManufacturerId(manufacturerLocal)
    setAssignedUserId(assignedUserLocal)
    setCreatedFrom(createdFromLocal)
    setCreatedTo(createdToLocal)
    setOrderBy(orderByLocal)
    setOrderDir(orderDirLocal)
    onApplyFilters()
    setOpen(false)
  }

  const clearFilters = () => {
    // clear locals and call parent's clear (parent should reset its state)
    setAssetCategoryLocal(null)
    setOfficeLocal(null)
    setLocationLocal(null)
    setManufacturerLocal(null)
    setAssignedUserLocal(null)
    setCreatedFromLocal(null)
    setCreatedToLocal(null)
    setOrderByLocal(null)
    setOrderDirLocal(null)
    onClearFilters()
    setOpen(false)
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 20px', flexWrap: 'wrap' }}>
      {/* Primary row: Search, Status, Filter button */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', minWidth: 0 }}>
        <div style={{ position: 'relative', flex: '1 1 420px', minWidth: 220 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search by name, code, or unit..."
            style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 14, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13.5, color: '#1E293B', outline: 'none', background: '#F8FAFC' }}
          />
        </div>

        <div style={{ minWidth: 140 }}>
          <select aria-label="Status filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); onApplyFilters() }} style={{ height: 38, minWidth: 140 }}>
            <option value="">All statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button size="sm" onClick={() => setOpen((v) => !v)}>{open ? 'Filter ▲' : 'Filter ▼'}</Button>
        </div>
      </div>

      {/* Advanced panel (collapsible) */}
      {open && (
        <div style={{ width: '100%', marginTop: 10, padding: 12, border: '1px solid #EEF2F7', borderRadius: 10, background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Asset Category</div>
            <SetupDropdown resource="asset-categories" options={mapOptions(assetCategories)} value={assetCategoryLocal ?? undefined} onChange={(v) => setAssetCategoryLocal(v ?? null)} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Office</div>
            <SetupDropdown resource="offices" options={mapOptions(offices)} value={officeLocal ?? undefined} onChange={(v) => setOfficeLocal(v ?? null)} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Location</div>
            <SetupDropdown resource="locations" options={mapOptions(locations)} value={locationLocal ?? undefined} onChange={(v) => setLocationLocal(v ?? null)} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Manufacturer</div>
            <SetupDropdown resource="manufacturers" options={mapOptions(manufacturers)} value={manufacturerLocal ?? undefined} onChange={(v) => setManufacturerLocal(v ?? null)} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Assigned User / Custodian</div>
            <IssuanceUserSearchSelect value={assignedUserLocal ?? null} onChange={(uid) => setAssignedUserLocal(uid ?? null)} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Created From</div>
            <input type="date" value={createdFromLocal ?? ''} onChange={(e) => setCreatedFromLocal(e.target.value || null)} style={{ height: 38, width: '100%' }} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Created To</div>
            <input type="date" value={createdToLocal ?? ''} onChange={(e) => setCreatedToLocal(e.target.value || null)} style={{ height: 38, width: '100%' }} />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Sort</div>
            <select value={orderByLocal ? `${orderByLocal}:${orderDirLocal}` : ''} onChange={(e) => {
              const v = e.target.value
              if (!v) { setOrderByLocal(null); setOrderDirLocal(null); return }
              const [k, d] = v.split(':')
              setOrderByLocal(k); setOrderDirLocal((d as 'ASC'|'DESC') || 'DESC')
            }} style={{ height: 38, width: '100%' }}>
              <option value="">Newest added</option>
              <option value="created_at:DESC">Newest added</option>
              <option value="created_at:ASC">Oldest added</option>
              <option value="name:ASC">Name A–Z</option>
              <option value="name:DESC">Name Z–A</option>
              <option value="quantity:DESC">Quantity: High → Low</option>
              <option value="quantity:ASC">Quantity: Low → High</option>
            </select>
          </div>

          {/* Action row spans full width */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button size="sm" variant="secondary" onClick={clearFilters}>Clear</Button>
            <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  )
}
