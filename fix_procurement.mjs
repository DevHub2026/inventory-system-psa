import { readFileSync, writeFileSync } from 'fs';

const f = 'frontend/src/pages/AssetPage.tsx';
let c = readFileSync(f, 'utf8');

// 1) Remove procurement fields from setEditForm block
c = c.replace(
  `        property_number: a.property_number ?? '',
        purchase_date: a.purchase_date ?? null,
        purchase_cost: typeof a.purchase_cost === 'string' ? parseFloat(a.purchase_cost) || null : (a.purchase_cost ?? null),
        warranty_until: a.warranty_until ?? null,`,
  `        property_number: a.property_number ?? '',`
);

// 2) Remove procurement fields from submitEdit payload
c = c.replace(
  `        purchase_date:    editForm.purchase_date || null,
        purchase_cost:    editForm.purchase_cost ?? null,
        warranty_until:   editForm.warranty_until || null,
      })`,
  `      })`
);

// 3) Replace the editable Procurement section with read-only display
const oldSection = `            {/* C: Procurement */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Procurement</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLS}>Purchase Date</label>
                  <input type="date" className={SELECT_CLS}
                    value={editForm.purchase_date ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value || null })} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Purchase Cost (₱)</label>
                  <input type="number" min={0} step="0.01" className={SELECT_CLS} placeholder="0.00"
                    value={editForm.purchase_cost ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, purchase_cost: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Warranty Until</label>
                  <input type="date" className={SELECT_CLS}
                    value={editForm.warranty_until ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, warranty_until: e.target.value || null })} />
                </div>
              </div>
            </div>`;

const newSection = `            {/* C: Procurement (read-only — Inventory-owned) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Procurement Information (managed in Inventory)</p>
                {editAsset.inventory_item_id && (
                  <button
                    type="button"
                    onClick={() => { setEditAsset(null); navigate('/inventory?highlight=' + editAsset.inventory_item_id) }}
                    className="inline-flex items-center gap-1 rounded border border-[#93C5FD] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"
                  >
                    <ExternalLink size={12} /> Open Inventory Item
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Purchase Date</p>
                  <p className="mt-1 rounded border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-2 text-[13.5px] text-[#1E293B]">{editAsset.purchase_date ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Purchase Cost</p>
                  <p className="mt-1 rounded border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-2 text-[13.5px] text-[#1E293B]">{typeof editAsset.purchase_cost === 'string' ? parseFloat(editAsset.purchase_cost) : editAsset.purchase_cost ?? ''}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Warranty Until</p>
                  <p className="mt-1 rounded border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-2 text-[13.5px] text-[#1E293B]">{editAsset.warranty_until ?? '—'}</p>
                </div>
              </div>
            </div>`;

c = c.replace(oldSection, newSection);

writeFileSync(f, c);
console.log('AssetPage procurement section replaced');
