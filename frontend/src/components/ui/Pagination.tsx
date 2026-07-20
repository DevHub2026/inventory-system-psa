import { Button } from '@/components/ui/Button'

interface PaginationProps {
  page: number
  lastPage: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, total, onPageChange }: PaginationProps) {
  if (lastPage <= 1) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs font-medium text-slate-500">
        Page {page} of {lastPage} · {total} records
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
