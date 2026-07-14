import { Card } from '@/components/ui'

const placeholders = [
  'Asset Inventory Report',
  'Borrowing History',
  'Reservation Summary',
  'Inventory Status',
  'Maintenance Log',
  'Audit Logs',
]

export function ReportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Placeholder cards only — no analytics yet.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((title) => (
          <Card key={title} title={title}>
            <p className="text-sm text-gray-500">Report endpoint placeholder. Connect later to /api/v1/reports/*.</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
