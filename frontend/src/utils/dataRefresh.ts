const DATA_CHANGED_EVENT = 'psa:data-changed'

export type DataChangeScope = 'assets' | 'borrowings' | 'reservations' | 'dashboard' | 'all'

export function notifyDataChanged(scope: DataChangeScope = 'all') {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { scope } }))
}

export function onDataChanged(callback: (scope: DataChangeScope) => void) {
  const handler = (event: Event) => {
    const scope = event instanceof CustomEvent ? event.detail?.scope ?? 'all' : 'all'
    callback(scope)
  }

  window.addEventListener(DATA_CHANGED_EVENT, handler)

  return () => window.removeEventListener(DATA_CHANGED_EVENT, handler)
}

export function affectsScope(changedScope: DataChangeScope, scope: DataChangeScope) {
  return changedScope === 'all' || changedScope === scope
}
