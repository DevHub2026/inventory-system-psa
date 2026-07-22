import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PaginationProps {
  page: number
  lastPage: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, total, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Record count */}
      <p className="text-[13px] font-medium text-[#6B7280]">
        Page <span className="text-[#1F2937]">{page}</span> of{' '}
        <span className="text-[#1F2937]">{lastPage}</span>
        <span className="mx-1 text-[#D1D5DB]">·</span>
        <span className="text-[#1F2937]">{total}</span> records
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
