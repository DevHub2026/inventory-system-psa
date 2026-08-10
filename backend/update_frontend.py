import os

# ─── 1. setupService.ts - add 'inventory-item-types' to SetupResource ───
p1 = r'frontend/src/services/setupService.ts'
with open(p1, 'r', encoding='utf-8') as f:
    s = f.read()
old = "export type SetupResource = 'asset-categories' | 'offices' | 'locations' | 'manufacturers' | 'departments' | 'units'"
new = "export type SetupResource = 'asset-categories' | 'offices' | 'locations' | 'manufacturers' | 'departments' | 'units' | 'inventory-item-types'"
s = s.replace(old, new)
with open(p1, 'w', encoding='utf-8') as f:
    f.write(s)
print('setupService.ts updated')

# ─── 2. types/index.ts - add InventoryItemType interface + fields ───
p2 = r'frontend/src/types/index.ts'
with open(p2, 'r', encoding='utf-8') as f:
    t = f.read()

# Add InventoryItemType interface right after the InventoryItem interface (before BorrowRequestResult)
inv_type_iface = '''
export interface InventoryItemType {
  id: number
  name: string
  code?: string | null
  description?: string | null
  is_active?: boolean
  inventory_items_count?: number
  created_by?: number | null
  updated_by?: number | null
  created_at?: string | null
  updated_at?: string | null
}
'''

# Insert InventoryItemType interface before BorrowRequestResult
marker = 'export interface BorrowRequestResult {'
t = t.replace(marker, inv_type_iface + '\n' + marker, 1)

# Add item_type_id and item_type_name to InventoryItem interface, after the type field
old_type = "  type?: 'non_expendable' | 'expendable' | string | null"
new_type = "  type?: 'non_expendable' | 'expendable' | string | null\n  item_type_id?: number | null\n  item_type_name?: string | null"
t = t.replace(old_type, new_type, 1)

with open(p2, 'w', encoding='utf-8') as f:
    f.write(t)
print('types/index.ts updated')
</arg_value><task_progress></tool_call>