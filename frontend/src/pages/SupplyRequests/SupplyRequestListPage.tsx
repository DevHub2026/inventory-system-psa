import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Card, Button, Spinner, Alert, Badge } from '@/components/ui'
import { supplyRequestService } from '@/services/supplyRequestService'
import type { SupplyRequest } from '@/services/supplyRequestService'
import { onDataChanged } from '@/utils/dataRefresh'
import { formatDate } from '@/utils/dateFormat'

export function SupplyRequestListPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await supplyRequestService.list()
      setRequests(res.items)
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return onDataChanged(loadData)
  }, [])

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader 
        title="Supply Requests" 
        
        actions={<Button onClick={() => navigate('/supply-requests/new')}>Request Supplies</Button>}
      />

      {error && <Alert tone="error" title="Error">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No supply requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">SR-{req.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.user?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(req.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={getStatusTone(req.status) as import('@/components/ui/Badge').Tone}>{req.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.items?.length || 0} items</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" onClick={() => navigate('/supply-requests/' + req.id)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}












