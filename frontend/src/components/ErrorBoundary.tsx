import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React runtime error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected application error occurred.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </button>
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Return to Dashboard
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
