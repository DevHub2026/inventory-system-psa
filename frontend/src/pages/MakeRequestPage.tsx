import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui'
import { ArrowRight, MonitorSmartphone, Highlighter, ClipboardList } from 'lucide-react'

export function MakeRequestPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Make a Request"
        subtitle="Choose the type of resource you need."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        <button
          onClick={() => navigate('/reservations?create=true')}
          className="group text-left outline-none focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <Card className="h-full p-6 flex flex-col justify-between border-2 border-transparent group-hover:border-blue-500/20 group-hover:shadow-md bg-white cursor-pointer transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <MonitorSmartphone size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Borrow an Asset</h2>
                <p className="text-slate-600 text-sm mb-3">
                  Request reusable equipment or assets for temporary use.
                </p>
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
                  E.g. Laptop, Projector
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors ml-[60px]">
              Proceed to Borrow <ArrowRight size={16} className="ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </button>

        <button
          onClick={() => navigate('/supply-requests/new')}
          className="group text-left outline-none focus:ring-2 focus:ring-blue-500 rounded-xl transition-all"
        >
          <Card className="h-full p-6 flex flex-col justify-between border-2 border-transparent group-hover:border-blue-500/20 group-hover:shadow-md bg-white cursor-pointer transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <Highlighter size={28} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Request Supplies</h2>
                <p className="text-slate-600 text-sm mb-3">
                  Request consumable office supplies for permanent issuance.
                </p>
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
                  E.g. Paper, Pens, Folders
                </div>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors ml-[60px]">
              Proceed to Request <ArrowRight size={16} className="ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </button>
      </div>

      <div className="mt-4 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">History & Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            onClick={() => navigate('/reservations')}
            className="group text-left outline-none focus:ring-2 focus:ring-slate-500 rounded-xl transition-all"
          >
            <Card className="h-full p-6 flex flex-col justify-between border-2 border-transparent group-hover:border-slate-300 group-hover:shadow-md bg-white cursor-pointer transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                  <ClipboardList size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">My Borrow Requests</h2>
                  <p className="text-slate-600 text-sm mb-3">
                    View and manage your previously submitted asset borrowing requests.
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors ml-[60px]">
                View History <ArrowRight size={16} className="ml-1.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </button>
        </div>
      </div>
    </div>
  )
}