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
    <div className={cn('overflow-x-auto rounded-lg border border-slate-100', className)}>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-[0.055em] text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn('px-4 py-3 font-semibold', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/35">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3.5 align-middle text-slate-700', column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
