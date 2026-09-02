import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { SetupDropdown } from '@/components/ui/SetupDropdown'
import { IssuanceUserSearchSelect } from '@/components/issuance/IssuanceUserSearchSelect'
import { Button } from '@/components/ui'
import type { SetupRecord } from '@/services/setupService'

interface StatusFilterOption {
  label: string
  value: string
}

export type AdvancedFilterField =
  | 'classification'
  | 'type'
  | 'itemType'
  | 'assetCategory'
  | 'office'
  | 'location'
  | 'manufacturer'
  | 'assignedUser'
  | 'createdFrom'
  | 'createdTo'
  | 'sort'

export interface InventoryFilterSnapshot {
  statusFilter: string
  classification: 'PPE' | 'SE' | 'SUPPLY' | null
  inventoryType: 'non_expendable' | 'expendable' | null
  itemTypeId: number | null
  assetCategoryId: number | null
  officeId: number | null
  locationId: number | null
  manufacturerId: number | null
  assignedUserId: number | null
  createdFrom: string | null
  createdTo: string | null
  orderBy: string | null
  orderDir: 'ASC' | 'DESC' | null
}

interface Props {
  // When true, indicates setup/master lists are loading (initial fetch)
  setupLoading?: boolean
  search: string
  setSearch: (v: string) => void
  onSearchKeyDown?: (e: React.KeyboardEvent) => void
  searchPlaceholder?: string

  statusFilter: string
  setStatusFilter: (v: string) => void
  statusOptions?: StatusFilterOption[]

  classification?: 'PPE' | 'SE' | 'SUPPLY' | null
  setClassification?: (v: 'PPE' | 'SE' | 'SUPPLY' | null) => void

  inventoryType?: 'non_expendable' | 'expendable' | null
  setInventoryType?: (v: 'non_expendable' | 'expendable' | null) => void

  itemTypeId?: number | null
  setItemTypeId?: (v: number | null) => void

  assetCategoryId?: number | null
  setAssetCategoryId?: (v: number | null) => void

  officeId?: number | null
  setOfficeId?: (v: number | null) => void

  locationId?: number | null
  setLocationId?: (v: number | null) => void

  manufacturerId?: number | null
  setManufacturerId?: (v: number | null) => void

  assignedUserId?: number | null
  setAssignedUserId?: (v: number | null) => void

  createdFrom?: string | null
  setCreatedFrom?: (v: string | null) => void

  createdTo?: string | null
  setCreatedTo?: (v: string | null) => void

  orderBy?: string | null
  setOrderBy?: (v: string | null) => void
  orderDir?: 'ASC' | 'DESC' | null
  setOrderDir?: (v: 'ASC' | 'DESC' | null) => void

  onApplyFilters?: (snapshot?: InventoryFilterSnapshot) => void
  onClearFilters?: (snapshot?: InventoryFilterSnapshot) => void

  assetCategories?: SetupRecord[]
  manufacturers?: SetupRecord[]
  offices?: SetupRecord[]
  locations?: SetupRecord[]
  itemTypes?: SetupRecord[]
  advancedFields?: AdvancedFilterField[]
}

export function InventoryFilterBar({
  search, setSearch, onSearchKeyDown, searchPlaceholder = 'Search by name, code, or unit...',
  statusFilter, setStatusFilter, statusOptions = [
    { label: 'All statuses', value: '' },
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
    { label: 'Disposed', value: 'DISPOSED' },
  ],
  classification = null, setClassification = () => undefined,
  inventoryType = null, setInventoryType = () => undefined,
  itemTypeId = null, setItemTypeId = () => undefined,
  assetCategoryId = null, setAssetCategoryId = () => undefined,
  officeId = null, setOfficeId = () => undefined,
  locationId = null, setLocationId = () => undefined,
  manufacturerId = null, setManufacturerId = () => undefined,
  assignedUserId = null, setAssignedUserId = () => undefined,
  createdFrom = null, setCreatedFrom = () => undefined,
  createdTo = null, setCreatedTo = () => undefined,
  orderBy = null, setOrderBy = () => undefined, orderDir = null, setOrderDir = () => undefined,
  onApplyFilters, onClearFilters,
  assetCategories = [], manufacturers = [], offices = [], locations = [], itemTypes = [],
  advancedFields = ['classification', 'type', 'itemType', 'assetCategory', 'office', 'location', 'manufacturer', 'assignedUser', 'createdFrom', 'createdTo', 'sort'],
  setupLoading = false,
}: Props) {
  const mapOptions = (arr: SetupRecord[]) => arr.map((r) => ({ label: r.name, value: r.id, raw: r }))

  const [open, setOpen] = useState(false)

  // Local advanced filter state (only applied when user clicks Apply)
  const [classificationLocal, setClassificationLocal] = useState<'PPE' | 'SE' | 'SUPPLY' | null>(classification ?? null)
  const [inventoryTypeLocal, setInventoryTypeLocal] = useState<'non_expendable' | 'expendable' | null>(inventoryType ?? null)
  const [itemTypeLocal, setItemTypeLocal] = useState<number | null>(itemTypeId ?? null)
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
      setClassificationLocal(classification ?? null)
      setInventoryTypeLocal(inventoryType ?? null)
      setItemTypeLocal(itemTypeId ?? null)
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
  }, [open, classification, inventoryType, itemTypeId, assetCategoryId, officeId, locationId, manufacturerId, assignedUserId, createdFrom, createdTo, orderBy, orderDir])

  const buildSnapshot = (): InventoryFilterSnapshot => ({
    statusFilter,
    classification: classificationLocal,
    inventoryType: inventoryTypeLocal,
    itemTypeId: itemTypeLocal,
    assetCategoryId: assetCategoryLocal,
    officeId: officeLocal,
    locationId: locationLocal,
    manufacturerId: manufacturerLocal,
    assignedUserId: assignedUserLocal,
    createdFrom: createdFromLocal,
    createdTo: createdToLocal,
    orderBy: orderByLocal,
    orderDir: orderDirLocal,
  })

  const applyFilters = () => {
    const snapshot = buildSnapshot()
    setClassification(classificationLocal)
    setInventoryType(inventoryTypeLocal)
    setItemTypeId(itemTypeLocal)
    setAssetCategoryId(assetCategoryLocal)
    setOfficeId(officeLocal)
    setLocationId(locationLocal)
    setManufacturerId(manufacturerLocal)
    setAssignedUserId(assignedUserLocal)
    setCreatedFrom(createdFromLocal)
    setCreatedTo(createdToLocal)
    setOrderBy(orderByLocal)
    setOrderDir(orderDirLocal)
    onApplyFilters?.(snapshot)
    setOpen(false)
  }

  const clearFilters = () => {
    const snapshot = buildSnapshot()
    setClassificationLocal(null)
    setInventoryTypeLocal(null)
    setItemTypeLocal(null)
    setAssetCategoryLocal(null)
    setOfficeLocal(null)
    setLocationLocal(null)
    setManufacturerLocal(null)
    setAssignedUserLocal(null)
    setCreatedFromLocal(null)
    setCreatedToLocal(null)
    setOrderByLocal(null)
    setOrderDirLocal(null)
    setClassification(null)
    setInventoryType(null)
    setItemTypeId(null)
    setAssetCategoryId(null)
    setOfficeId(null)
    setLocationId(null)
    setManufacturerId(null)
    setAssignedUserId(null)
    setCreatedFrom(null)
    setCreatedTo(null)
    setOrderBy(null)
    setOrderDir(null)
    onClearFilters?.(snapshot)
    setOpen(false)
  }

  const enabledFields = new Set(advancedFields)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 38,
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    background: '#FFFFFF',
    padding: '0 12px',
    fontSize: 13.5,
    color: '#1E293B',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.02)',
  }

  const sectionStyle: React.CSSProperties = {
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    background: '#F8FAFC',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: '100%',
  }

  const sectionTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#475569',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    color: '#334155',
  }

  const renderField = (label: string, element: React.ReactNode) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {element}
    </div>
  )

  const defaultAdvancedPanel = (
    <>
      {enabledFields.has('classification') || enabledFields.has('type') ? (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#0D47A1', display: 'inline-block' }} />
            Classification
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {enabledFields.has('classification') && renderField('Classification', (
              <select value={classificationLocal ?? ''} onChange={(e) => setClassificationLocal((e.target.value as 'PPE' | 'SE' | 'SUPPLY') || null)} style={inputStyle}>
                <option value="">All classifications</option>
                <option value="PPE">PPE</option>
                <option value="SE">Semi-Expendable</option>
                <option value="SUPPLY">Supply</option>
              </select>
            ))}
            {enabledFields.has('type') && renderField('Inventory Type', (
              <select value={inventoryTypeLocal ?? ''} onChange={(e) => setInventoryTypeLocal((e.target.value as 'non_expendable' | 'expendable') || null)} style={inputStyle}>
                <option value="">All inventory types</option>
                <option value="non_expendable">Non-expendable</option>
                <option value="expendable">Expendable</option>
              </select>
            ))}
          </div>
        </div>
      ) : null}

      {(enabledFields.has('itemType') || enabledFields.has('assetCategory') || enabledFields.has('manufacturer')) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#2563EB', display: 'inline-block' }} />
            Item Details
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {enabledFields.has('itemType') && renderField('Item Type', (
              <SetupDropdown resource="inventory-item-types" options={mapOptions(itemTypes)} value={itemTypeLocal ?? undefined} onChange={(v) => setItemTypeLocal(v ?? null)} isLoading={setupLoading} />
            ))}
            {enabledFields.has('assetCategory') && renderField('Asset Category', (
              <SetupDropdown resource="asset-categories" options={mapOptions(assetCategories)} value={assetCategoryLocal ?? undefined} onChange={(v) => setAssetCategoryLocal(v ?? null)} isLoading={setupLoading} />
            ))}
            {enabledFields.has('manufacturer') && renderField('Manufacturer', (
              <SetupDropdown resource="manufacturers" options={mapOptions(manufacturers)} value={manufacturerLocal ?? undefined} onChange={(v) => setManufacturerLocal(v ?? null)} isLoading={setupLoading} />
            ))}
          </div>
        </div>
      )}

      {(enabledFields.has('office') || enabledFields.has('location')) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#16A34A', display: 'inline-block' }} />
            Organization
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {enabledFields.has('office') && renderField('Office', (
              <SetupDropdown resource="offices" options={mapOptions(offices)} value={officeLocal ?? undefined} onChange={(v) => setOfficeLocal(v ?? null)} isLoading={setupLoading} />
            ))}
            {enabledFields.has('location') && renderField('Location', (
              <SetupDropdown resource="locations" options={mapOptions(locations)} value={locationLocal ?? undefined} onChange={(v) => setLocationLocal(v ?? null)} isLoading={setupLoading} />
            ))}
          </div>
        </div>
      )}

      {enabledFields.has('assignedUser') && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#7C3AED', display: 'inline-block' }} />
            Assignment
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {renderField('Assigned User / Custodian', (
              <IssuanceUserSearchSelect value={assignedUserLocal ?? null} onChange={(uid) => setAssignedUserLocal(uid ?? null)} />
            ))}
          </div>
        </div>
      )}

      {(enabledFields.has('createdFrom') || enabledFields.has('createdTo') || enabledFields.has('sort')) && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#F59E0B', display: 'inline-block' }} />
            Date Range &amp; Sorting
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {enabledFields.has('createdFrom') && renderField('Created From', (
              <input type="date" value={createdFromLocal ?? ''} onChange={(e) => setCreatedFromLocal(e.target.value || null)} style={inputStyle} />
            ))}
            {enabledFields.has('createdTo') && renderField('Created To', (
              <input type="date" value={createdToLocal ?? ''} onChange={(e) => setCreatedToLocal(e.target.value || null)} style={inputStyle} />
            ))}
            {enabledFields.has('sort') && renderField('Sort By', (
              <select value={orderByLocal ? `${orderByLocal}:${orderDirLocal}` : ''} onChange={(e) => {
                const v = e.target.value
                if (!v) { setOrderByLocal(null); setOrderDirLocal(null); return }
                const [k, d] = v.split(':')
                setOrderByLocal(k); setOrderDirLocal((d as 'ASC'|'DESC') || 'DESC')
              }} style={inputStyle}>
                <option value="">Newest added</option>
                <option value="created_at:DESC">Newest added</option>
                <option value="created_at:ASC">Oldest added</option>
                <option value="name:ASC">Name A–Z</option>
                <option value="name:DESC">Name Z–A</option>
                <option value="quantity:DESC">Quantity: High → Low</option>
                <option value="quantity:ASC">Quantity: Low → High</option>
              </select>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const actionRow = (
    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
      <Button size="sm" variant="secondary" onClick={clearFilters}>Clear</Button>
      <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 20px', flexWrap: 'wrap' }}>
      {/* Primary row: Search, Status, Filter button */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', minWidth: 0 }}>
        <div style={{ position: 'relative', flex: '1 1 420px', minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder}
            style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 14, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13.5, color: '#1E293B', outline: 'none', background: '#F8FAFC', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <select aria-label="Status filter" value={statusFilter} onChange={(e) => {
            const nextStatus = e.target.value
            setStatusFilter(nextStatus)
            onApplyFilters?.({
              ...buildSnapshot(),
              statusFilter: nextStatus,
            })
          }} style={{ height: 38, minWidth: 160, width: '100%', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#FFFFFF', padding: '0 12px', color: '#1E293B', outline: 'none' }}>
            {statusOptions.map((option) => (
              <option key={`${option.value || 'all'}-${option.label}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button size="sm" onClick={() => setOpen((v) => !v)}>{open ? 'Filter ▲' : 'Filter ▼'}</Button>
        </div>
      </div>

      {/* Advanced panel (collapsible) */}
      {open && (
        <div style={{ width: '100%', marginTop: 8, padding: 14, border: '1px solid #E2E8F0', borderRadius: 16, background: '#FFFFFF', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
          {defaultAdvancedPanel}
          {actionRow}
        </div>
      )}
    </div>
  )
}
