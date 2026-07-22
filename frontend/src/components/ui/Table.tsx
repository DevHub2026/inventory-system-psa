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
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#E2EAF3] bg-[#F4F7FC]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748B] whitespace-nowrap',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F8]">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="bg-white transition-colors hover:bg-[#F8FAFD]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 align-middle text-sm text-slate-700',
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
