export interface FAQAction {
  label: string
  type: 'route'
  target: string
}

export interface FAQItem {
  id: string | number
  question: string
  answer: string
  category?: string
  roles?: string[]
  keywords?: string[]
  actions?: FAQAction[]
  destination?: string
  destinationRoute?: string
  destinationLabel?: string
  active?: boolean
  published?: boolean
}

export const DEFAULT_FAQ_SEED: FAQItem[] = [
  {
    id: 'find-asset',
    question: 'How do I find an asset in the system?',
    answer: 'Open Assets or Inventory, use the search field, and narrow the list with the available filters. Select the asset to open its detail view and review the current assignment, location, status, and related operational record.',
    category: 'Assets',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer'],
    keywords: ['asset', 'search', 'inventory', 'details', 'location', 'status'],
    destination: '/assets',
    destinationRoute: '/assets',
    destinationLabel: 'Open Assets',
    actions: [
      { label: 'Open Assets', type: 'route', target: '/assets' },
      { label: 'Open Inventory', type: 'route', target: '/inventory' },
    ],
    active: true,
    published: true,
  },
  {
    id: 'inventory-search-filter',
    question: 'How do I search and filter inventory?',
    answer: 'Open Inventory and use the search box together with the filter controls to narrow the list by relevant criteria. The page keeps the current search, sort order, and export actions aligned with the active filters so the displayed results match the selection you made.',
    category: 'Inventory',
    roles: ['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer'],
    keywords: ['inventory', 'search', 'filter', 'status', 'location', 'category', 'sort', 'export'],
    destination: '/inventory',
    destinationRoute: '/inventory',
    destinationLabel: 'Open Inventory',
    actions: [{ label: 'Open Inventory', type: 'route', target: '/inventory' }],
    active: true,
    published: true,
  },
  {
    id: 'borrow-asset',
    question: 'How do I borrow an item?',
    answer: 'Open Borrowings and follow the supported borrowing flow for the asset or request you need. If the item has a QR code attached, you can also open the QR Scanner and scan the physical asset code to identify it before continuing the verified borrowing steps. Complete any required approval or issue action available to your role before the item is issued.',
    category: 'Borrowing',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head'],
    keywords: ['borrow', 'borrowing', 'asset', 'qr', 'issue'],
    destination: '/borrowings',
    destinationRoute: '/borrowings',
    destinationLabel: 'Open Borrowings',
    actions: [
      { label: 'Open Borrowings', type: 'route', target: '/borrowings' },
      { label: 'Open QR Scanner', type: 'route', target: '/qr' },
    ],
    active: true,
    published: true,
  },
  {
    id: 'return-item',
    question: 'How do I return a borrowed item?',
    answer: 'Open Borrowings, select the active borrowing, and use the return action available for your role. Completing the return updates the borrowing record and the asset status so the item is no longer treated as issued or currently checked out.',
    category: 'Borrowing',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head'],
    keywords: ['return', 'borrowings', 'due date', 'issued', 'complete return'],
    destination: '/borrowings',
    destinationRoute: '/borrowings',
    destinationLabel: 'Open Borrowings',
    actions: [{ label: 'Open Borrowings', type: 'route', target: '/borrowings' }],
    active: true,
    published: true,
  },
  {
    id: 'qr-scanner',
    question: 'How do I use the QR scanner?',
    answer: 'Open QR Scanner and point it at the PSA QR code attached to the asset or related record. The scanner identifies the item and opens the supported asset-detail workflow so you can continue the next verified action without manually searching for the record.',
    category: 'QR',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor'],
    destination: '/qr',
    destinationRoute: '/qr',
    destinationLabel: 'Open QR Scanner',
    actions: [{ label: 'Open QR Scanner', type: 'route', target: '/qr' }],
    active: true,
    published: true,
  },
  {
    id: 'reservations',
    question: 'How do I manage reservations?',
    answer: 'Open Reservations to view current reservation records, create a new request if your role allows it, and follow the workflow for the relevant asset or availability check. The list updates with the current state of each reservation so you can see what is pending or already processed.',
    category: 'Reservations',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head'],
    keywords: ['reservation', 'reserve', 'booking', 'availability', 'schedule'],
    destination: '/reservations',
    destinationRoute: '/reservations',
    destinationLabel: 'Open Reservations',
    actions: [{ label: 'Open Reservations', type: 'route', target: '/reservations' }],
    active: true,
    published: true,
  },
  {
    id: 'extension-request',
    question: 'How do I request an extension to a due date?',
    answer: 'Open Extension Requests to review the existing borrowing record and submit a due-date extension request if the workflow is available to your role. Approvers can then review the request and decide whether to approve or reject it before the updated due date is applied.',
    category: 'Extension Requests',
    roles: ['Employee', 'Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head'],
    keywords: ['extension', 'extensions', 'due date', 'due-date', 'approval', 'borrow extension'],
    destination: '/extension-requests',
    destinationRoute: '/extension-requests',
    destinationLabel: 'Open Extension Requests',
    actions: [{ label: 'Open Extension Requests', type: 'route', target: '/extension-requests' }],
    active: true,
    published: true,
  },
  {
    id: 'system-setup',
    question: 'How do I manage system setup?',
    answer: 'Open System Setup to review the configuration records used across the application, including departments, offices, locations, manufacturers, categories, and related reference data. Only the roles with system administration responsibilities should use this page to maintain those records.',
    category: 'System Setup',
    roles: ['Super Administrator', 'System Administrator'],
    keywords: ['system setup', 'setup', 'department', 'office', 'location', 'manufacturer', 'category', 'configuration'],
    destination: '/system-setup',
    destinationRoute: '/system-setup',
    destinationLabel: 'Open System Setup',
    actions: [{ label: 'Open System Setup', type: 'route', target: '/system-setup' }],
    active: true,
    published: true,
  },

  {
    id: 'reports',
    question: 'How do I view reports?',
    answer: 'Open Reports to review the operational summaries and historical views available to your role. This page is the main place to inspect reporting data for inventory, borrowing, and related activity across the application.',
    category: 'Reports',
    roles: ['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer', 'Department Head', 'Auditor', 'Supply Officer'],
    keywords: ['report', 'reports', 'history', 'summary', 'analytics', 'overview'],
    destination: '/reports',
    destinationRoute: '/reports',
    destinationLabel: 'Open Reports',
    actions: [{ label: 'Open Reports', type: 'route', target: '/reports' }],
    active: true,
    published: true,
  },
  {
    id: 'user-roles',
    question: 'How do I manage users and roles?',
    answer: 'Open Users or Roles if your role includes administrative access. These pages are used for user administration and role-based access management, while day-to-day operational tasks remain governed by the application’s existing permissions and workflows.',
    category: 'Users',
    roles: ['Super Administrator', 'System Administrator'],
    keywords: ['users', 'roles', 'administration', 'access', 'permissions'],
    destination: '/users',
    destinationRoute: '/users',
    destinationLabel: 'Open Users',
    actions: [
      { label: 'Open Users', type: 'route', target: '/users' },
      { label: 'Open Roles', type: 'route', target: '/roles' },
    ],
    active: true,
    published: true,
  },
]

export const FAQ_ROUTE_CONTEXTS: Record<string, string[]> = {
  '/dashboard': ['dashboard', 'overview', 'navigation', 'help', 'home'],
  '/borrowings': ['borrowing', 'borrow', 'return', 'returns', 'extension', 'extensions', 'due date', 'qr', 'issued asset', 'issued assets', 'loan', 'loans'],
  '/inventory': ['inventory', 'inventory search', 'filter', 'stock', 'item', 'asset', 'qr', 'location', 'warehouse'],
  '/assets': ['asset', 'asset details', 'tracking', 'qr', 'assignment', 'location'],
  '/reservations': ['reservation', 'reservations', 'booking', 'schedule', 'calendar', 'hold'],
  '/qr': ['qr', 'scanner', 'scan', 'asset identification', 'asset lookup'],
  '/reports': ['report', 'reports', 'export', 'analytics', 'summary', 'history'],
  '/system-setup': ['system setup', 'setup', 'department', 'location', 'config', 'configuration', 'roles', 'users'],
  '/documentation': ['documentation', 'guides', 'help', 'reference'],
  '/users': ['users', 'user', 'directory', 'profile', 'employee'],
  '/roles': ['roles', 'permissions', 'access', 'authorization'],
  '/extension-requests': ['extension', 'extensions', 'due date', 'approval', 'borrow extension'],
}

export function getFaqRouteContext(pathname: string): { label: string; keywords: string[] } {
  const normalized = pathname && pathname !== '/' ? pathname : '/dashboard'
  const matchedRoute = Object.keys(FAQ_ROUTE_CONTEXTS).find((route) => normalized === route || normalized.startsWith(`${route}/`)) ?? '/dashboard'
  const context = FAQ_ROUTE_CONTEXTS[matchedRoute] ?? FAQ_ROUTE_CONTEXTS['/dashboard']

  const label = matchedRoute === '/dashboard'
    ? 'Dashboard'
    : matchedRoute
      .replace(/^\//, '')
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return { label, keywords: context }
}

export function getFaqContextRelevanceScore(faq: Partial<FAQItem>, pathname: string): number {
  const { keywords } = getFaqRouteContext(pathname)
  const haystack = [
    faq.question ?? '',
    faq.answer ?? '',
    faq.category ?? '',
    ...(faq.keywords ?? []),
    faq.destination ?? '',
    faq.destinationRoute ?? '',
    ...(faq.actions ?? []).map((action) => `${action.label} ${action.target}`),
  ].join(' ').toLowerCase()

  return keywords.reduce((score, keyword) => {
    const normalizedKeyword = keyword.toLowerCase()
    return haystack.includes(normalizedKeyword) ? score + 2 : score
  }, 0)
}

export function normalizeFaq(item: Partial<FAQItem> & { id?: string | number }): FAQItem {
  const active = item.active ?? item.published ?? true
  const baseActions = (item.actions ?? []).map((action) => ({
    label: action.label || 'Open page',
    type: 'route' as const,
    target: action.target || item.destination || item.destinationRoute || '',
  }))

  const destinationRoute = item.destinationRoute ?? item.destination ?? baseActions[0]?.target ?? ''
  const destinationLabel = item.destinationLabel ?? baseActions[0]?.label ?? 'Open page'

  const actions = destinationRoute && !baseActions.some((action) => action.target === destinationRoute)
    ? [{ label: destinationLabel, type: 'route' as const, target: destinationRoute }, ...baseActions]
    : baseActions

  return {
    id: item.id ?? `faq-${Date.now()}`,
    question: item.question ?? 'Untitled FAQ',
    answer: item.answer ?? '',
    category: item.category || 'General',
    roles: Array.isArray(item.roles) ? item.roles : [],
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    destination: destinationRoute,
    destinationRoute,
    destinationLabel,
    actions,
    active,
    published: active,
  }
}
