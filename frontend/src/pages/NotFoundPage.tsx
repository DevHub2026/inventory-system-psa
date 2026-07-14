import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center" title="404 — Page not found">
        <p className="mb-4 text-sm text-gray-600">The page you requested does not exist.</p>
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
