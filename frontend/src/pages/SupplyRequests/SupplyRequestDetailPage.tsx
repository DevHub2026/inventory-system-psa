import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Card, Button, Spinner, Alert, Badge, Input } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { supplyRequestService } from '@/services/supplyRequestService'
import type { SupplyRequest } from '@/services/supplyRequestService'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, isAdmin, isStaff } from '@/utils/roleHelpers'
import { notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import type { Tone } from '@/components/ui/Badge'
import { AlertTriangle, Info } from 'lucide-react'

export function SupplyRequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [request, setRequest] = useState<SupplyRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFulfill, setShowFulfill] = useState(false)
  const [fulfilling, setFulfilling] = useState(false)
  
  const [issuedQuantities, setIssuedQuantities] = useState<Record<number, number>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await supplyRequestService.get(id!)
      setRequest(data)
      const initialQtys: Record<number, number> = {}
      data.items?.forEach((i: import('@/services/supplyRequestService').SupplyRequestItem) => {
        // Only set default if not short, otherwise leave blank to force user action, or set to requested and let them correct it.
        // The prompt: "Do not automatically change the issued quantity without the user's action."
        // We will default to requested. The user will be warned if it exceeds available.
        initialQtys[i.id] = i.quantity_issued !== null ? i.quantity_issued : i.quantity_requested
      })
      setIssuedQuantities(initialQtys)
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    return onDataChanged(load)
  }, [load])

  const handleFulfillSubmit = async () => {
    setFulfilling(true)
    setError(null)
    try {
      // Client side validation just in case
      for (const item of request?.items || []) {
        const qty = issuedQuantities[item.id]
        if (qty === undefined || isNaN(qty) || qty < 0) {
          throw new Error('Please enter a valid issue quantity for all items.')
        }
        if (qty > (item.inventoryItem?.quantity || 0)) {
          throw new Error(`Cannot issue more than available stock for ${item.inventoryItem?.name}.`)
        }
      }

      const payload = {
        items: Object.keys(issuedQuantities).map(itemId => ({
          supply_request_item_id: parseInt(itemId),
          quantity_issued: issuedQuantities[parseInt(itemId)]
        }))
      }
      await supplyRequestService.fulfill(id!, payload)
      setShowFulfill(false)
      notifyDataChanged('all')
      load()
    } catch (err: unknown) {
      setError(((err as { response?: { data?: { message?: string } } }).response)?.data?.message || (err as Error).message || 'Failed to fulfill request.')
    } finally {
      setFulfilling(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this request?')) return
    try {
      await supplyRequestService.approve(id!)
      notifyDataChanged('all')
      load()
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const handleReject = async () => {
    const remarks = prompt('Reason for rejection:')
    if (remarks === null) return
    try {
      await supplyRequestService.reject(id!, remarks)
      notifyDataChanged('all')
      load()
    } catch (err: unknown) {
      setError((err as Error).message)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    try {
      await supplyRequestService.cancel(id!)
      notifyDataChanged('all')
      load()
    } catch (err: unknown) {
      setError(((err as { response?: { data?: { message?: string } } }).response)?.data?.message || (err as Error).message)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Spinner /></div>
  if (!request) return <div className="p-8 text-center text-slate-500">Request not found</div>

  const canFulfill = request.status === 'APPROVED' && hasPermission(user, 'supply_requests.fulfill')
  const canApprove = request.status === 'PENDING' && (isAdmin(user) || isStaff(user))
  const canCancel = (request.status === 'PENDING' || request.status === 'APPROVED') && (user?.id === request.user_id || hasPermission(user, 'supply_requests.fulfill'))

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow'
      case 'APPROVED': return 'blue'
      case 'FULFILLED': return 'green'
      case 'PARTIALLY_FULFILLED': return 'orange'
      case 'REJECTED': return 'red'
      case 'CANCELLED': return 'gray'
      default: return 'gray'
    }
  }

  const isPartiallyFulfilled = request.status === 'PARTIALLY_FULFILLED'
  const hasShortfall = request.items?.some(i => i.quantity_issued !== null && i.quantity_issued < i.quantity_requested)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title={"Supply Request SR-" + request.id} 
        actions={
          <div className="flex flex-wrap gap-2">
            {canCancel && <Button variant="outline" onClick={handleCancel}>Cancel Request</Button>}
            {canApprove && <Button variant="outline" onClick={handleReject}>Reject</Button>}
            {canApprove && <Button onClick={handleApprove}>Approve</Button>}
            {canFulfill && <Button onClick={() => setShowFulfill(true)}>Fulfill Supplies</Button>}
          </div>
        }
      />

      {error && <Alert tone="error" title="Error">{error}</Alert>}

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200">
          <div>
            <div className="text-sm text-slate-500 mb-1">Status</div>
            <Badge tone={getStatusTone(request.status) as Tone}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Requester</div>
            <div className="font-medium text-slate-900">{request.user?.name}</div>
          </div>
          {request.remarks && (
            <div className="col-span-2">
              <div className="text-sm text-slate-500 mb-1">Remarks</div>
              <div className="text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-100">{request.remarks}</div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-medium text-slate-900 mb-4">Requested Items</h3>
        
        {isPartiallyFulfilled && hasShortfall && (
          <div className="mb-4 bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-100 flex items-start gap-3 text-sm">
            <Info className="flex-shrink-0 mt-0.5 text-orange-500" size={16} />
            <div>
              <p className="font-medium">Partial Fulfillment Notice</p>
              <p className="opacity-90 mt-0.5">Some items were not fully issued due to stock limitations. Unissued quantities are closed and will not be backordered.</p>
            </div>
          </div>
        )}

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Requested</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Issued</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {request.items?.map(item => {
                const shortfall = item.quantity_issued !== null && item.quantity_issued < item.quantity_requested 
                  ? item.quantity_requested - item.quantity_issued 
                  : 0

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {item.inventoryItem?.name}
                      <div className="text-xs text-slate-500">{item.inventoryItem?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity_requested} {item.inventoryItem?.unit}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                      {item.quantity_issued !== null ? (
                        <div className="flex flex-col items-end">
                          <span>{item.quantity_issued} {item.inventoryItem?.unit || ''}</span>
                          {shortfall > 0 && (
                            <span className="text-xs text-orange-600 font-normal mt-0.5">({shortfall} unissued)</span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showFulfill && (
        <Modal open={true} title="Fulfill Supply Request" onClose={() => setShowFulfill(false)} >
          <div className="space-y-4 p-1">
            <p className="text-sm text-slate-600">Review requested quantities against available stock, then input the actual amount to issue.</p>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Requested</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Available</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {request.items?.map(item => {
                    const isShort = (item.inventoryItem?.quantity || 0) < item.quantity_requested
                    return (
                      <tr key={item.id} className={isShort ? "bg-red-50/40" : "bg-white"}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {item.inventoryItem?.name}
                          {isShort && (
                            <div className="text-xs text-red-700 flex items-center gap-1 mt-1 font-normal">
                              <AlertTriangle size={12} /> Insufficient stock
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-semibold text-slate-900">
                          {item.quantity_requested}
                        </td>
                        <td className={`px-4 py-3 text-sm text-center font-semibold ${isShort ? 'text-red-700' : 'text-emerald-600'}`}>
                          {item.inventoryItem?.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-block w-24">
                            <Input 
                              type="number"
                              min={0}
                              max={item.inventoryItem?.quantity}
                              value={issuedQuantities[item.id] !== undefined ? issuedQuantities[item.id] : ''}
                              onChange={e => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                                setIssuedQuantities({...issuedQuantities, [item.id]: val})
                              }}
                              className={isShort ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowFulfill(false)}>Cancel</Button>
              <Button onClick={handleFulfillSubmit} loading={fulfilling}>Confirm Fulfillment</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}