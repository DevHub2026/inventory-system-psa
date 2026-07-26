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
      <table style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', textAlign: 'left' }}>

        {/* Header */}
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={col.className}
                style={{
                  padding: '10px 16px',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.className}
                  style={{
                    padding: '14px 16px',
                    verticalAlign: 'middle',
                    fontSize: 13,
                    color: '#334155',
                  }}
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
