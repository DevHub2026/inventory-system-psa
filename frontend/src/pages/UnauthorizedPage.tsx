import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center" title="401 — Unauthorized">
        <p className="mb-4 text-sm text-gray-600">You do not have permission to view this page.</p>
        <div className="flex justify-center gap-2">
          <Link to="/login">
            <Button variant="secondary">Login</Button>
          </Link>
          <Link to="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
