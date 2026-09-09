import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Card, Button, Input, Spinner, Alert } from '@/components/ui'
import { supplyRequestService } from '@/services/supplyRequestService'
import type { CreateSupplyRequestPayload } from '@/services/supplyRequestService'
import { inventoryService } from '@/services/inventoryService'
import type { InventoryItem } from '@/types'
import { notifyDataChanged } from '@/utils/dataRefresh'
import { ShoppingCart, CheckCircle2, Circle } from 'lucide-react'

export function CreateSupplyRequestPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [supplies, setSupplies] = useState<InventoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [selectedItems, setSelectedItems] = useState<{ inventory_item_id: number; quantity_requested: number; item: InventoryItem }[]>([])
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await inventoryService.list({ classification: 'SUPPLY', per_page: 500 })
        setSupplies(res.items)
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to load supplies.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      setError('Please select at least one supply item.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload: CreateSupplyRequestPayload = {
        remarks: remarks || undefined,
        items: selectedItems.map(i => ({ inventory_item_id: i.inventory_item_id, quantity_requested: i.quantity_requested }))
      }
      await supplyRequestService.create(payload)
      notifyDataChanged('all')
      navigate('/supply-requests')
    } catch (err: unknown) {
      setError(((err as { response?: { data?: { message?: string } } }).response)?.data?.message || (err as Error).message || 'Failed to submit supply request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleSelect = (item: InventoryItem) => {
    if (item.quantity === 0) return
    const isSelected = selectedItems.some(i => i.inventory_item_id === item.id)
    if (isSelected) {
      setSelectedItems(prev => prev.filter(i => i.inventory_item_id !== item.id))
    } else {
      setSelectedItems(prev => [...prev, { inventory_item_id: item.id, quantity_requested: 1, item }])
    }
  }

  const handleQuantityChange = (item: InventoryItem, qtyStr: string) => {
    if (qtyStr === '') {
       setSelectedItems(prev => prev.filter(i => i.inventory_item_id !== item.id))
       return
    }
    
    let qty = parseInt(qtyStr, 10)
    if (isNaN(qty) || qty <= 0) {
      setSelectedItems(prev => prev.filter(i => i.inventory_item_id !== item.id))
      return
    }
    if (qty > item.quantity) {
      qty = item.quantity
    }

    setSelectedItems(prev => {
      const exists = prev.find(i => i.inventory_item_id === item.id)
      if (exists) {
        return prev.map(i => i.inventory_item_id === item.id ? { ...i, quantity_requested: qty } : i)
      }
      return [...prev, { inventory_item_id: item.id, quantity_requested: qty, item }]
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Request Supplies"
        subtitle="Select consumable items and quantities below."
      />

      {error && <Alert tone="error" title="Error">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Available Supplies</h3>
              
              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
                {supplies.map(item => {
                  const isSelected = selectedItems.some(i => i.inventory_item_id === item.id)
                  const selectedQty = selectedItems.find(i => i.inventory_item_id === item.id)?.quantity_requested || ''
                  const isOutOfStock = item.quantity === 0
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isOutOfStock ? 'bg-slate-50 opacity-60' : 
                        isSelected ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleToggleSelect(item)}>
                        <button type="button" disabled={isOutOfStock} className={`focus:outline-none flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                          {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{item.name}</div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {item.sku ? `${item.sku} • ` : ''} 
                            <span className={isOutOfStock ? 'text-red-500 font-medium' : ''}>
                              Available: {item.quantity} {item.unit || 'units'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-32 pl-10 sm:pl-0">
                        {isSelected ? (
                          <Input 
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={selectedQty}
                            placeholder="Qty"
                            disabled={isOutOfStock}
                            onChange={(e) => handleQuantityChange(item, e.target.value)}
                          />
                        ) : (
                          <div className="h-[38px] flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded border border-transparent select-none">
                            Select to request
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {supplies.length === 0 && (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <ShoppingCart className="text-slate-300 mb-3" size={48} />
                    <p className="text-slate-600 font-medium text-lg">No Supplies Available</p>
                    <p className="text-slate-500 text-sm mt-1">There are currently no consumable supplies in the inventory.</p>
                  </div>
                )}
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-3 text-blue-800 font-medium">
                  <ShoppingCart size={18} />
                  Request Summary
                </div>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.inventory_item_id} className="flex justify-between text-sm text-slate-600">
                      <span>{item.item.name}</span>
                      <span className="font-medium">{item.quantity_requested} {item.item.unit || 'units'}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-blue-200/60 flex justify-between font-medium text-blue-900">
                    <span>Total Unique Items</span>
                    <span>{selectedItems.length}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Remarks (Optional)</label>
              <textarea 
                rows={3} 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                placeholder="Reason for requesting these supplies..." 
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => navigate('/make-request')}>Cancel</Button>
              <Button type="submit" loading={submitting} disabled={submitting || selectedItems.length === 0}>Submit Request</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}