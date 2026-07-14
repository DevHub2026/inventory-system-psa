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
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn('px-3 py-2 font-medium', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-3 py-2 align-middle text-gray-800', column.className)}>
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
