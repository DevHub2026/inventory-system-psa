import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  empty?: ReactNode
  className?: string
}

export function Table<T>({ columns, rows, rowKey, empty, className }: TableProps<T>) {
  if (rows.length === 0) {
    return <>{empty}</>
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full table-auto text-left text-sm">

        {/* ── Sticky header ── */}
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  // typography
                  'px-4 py-3.5',
                  'text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]',
                  'whitespace-nowrap',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-[#F3F4F6]">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="bg-white transition-colors duration-150 hover:bg-[#F5F7FA]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 align-middle',
                    'text-[14px] text-[#1F2937]',
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
