import { ArrowRight, FileBarChart, History as HistoryIcon, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'

const historyCards = [
  {
    title: 'Reports',
    description: 'Official operational reports and managed exports.',
    to: '/reports',
    icon: FileBarChart,
    tone: 'blue',
  },
  {
    title: 'Audit Logs',
    description: 'System event trail and module activity for administrative review.',
    to: '/audit-logs',
    icon: ShieldCheck,
    tone: 'violet',
  },
  {
    title: 'QR Scan Audit History',
    description: 'Employee QR interactions, device context, and scan actions.',
    to: '/qr-scan-history',
    icon: HistoryIcon,
    tone: 'slate',
  },
]

export function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="History & Audit"
        subtitle="Review operational reports, audit information, and QR scan activity while keeping the active review separated from archived records."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {historyCards.map(({ title, description, to, icon: Icon, tone }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className={`mb-4 inline-flex rounded-xl border p-2 ${
              tone === 'blue'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : tone === 'violet'
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Archived records are retained in the database as soft-deleted history and are not destroyed by the active archive action.
      </div>
    </div>
  )
}
