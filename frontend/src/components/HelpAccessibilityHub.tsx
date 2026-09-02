import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Modal, Button } from '@/components/ui'
import AccessibilityQaPanel from './AccessibilityQaPanel'
import { getFaqContextRelevanceScore, getFaqRouteContext, type FAQAction, type FAQItem } from '@/help/faq'
import { useAuth } from '@/hooks/useAuth'
import { getPreferences, setPreferences } from '@/utils/accessibilityPreferences'
import type { AccessibilityPreferences } from '@/utils/accessibilityPreferences'
import { hasPermission } from '@/utils/roleHelpers'
import { faqService } from '@/services/faqService'

const baseTabs = ['Settings', 'Help & FAQ', 'My Role', 'Diagnostics'] as const
export type HubTab = typeof baseTabs[number] | 'Documentation'

const VERIFIED_ROUTE_OPTIONS = [
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Borrowings', value: '/borrowings' },
  { label: 'Inventory', value: '/inventory' },
  { label: 'Assets', value: '/assets' },
  { label: 'Reservations', value: '/reservations' },
  { label: 'QR Scanner', value: '/qr' },
  { label: 'Reports', value: '/reports' },
  { label: 'System Setup', value: '/system-setup' },
  { label: 'Documentation', value: '/documentation' },
  { label: 'Users', value: '/users' },
  { label: 'Roles', value: '/roles' },
  { label: 'Extension Requests', value: '/extension-requests' },
] as const

const ROLE_PROFILES: Record<string, { responsibilities: string[]; links: Array<{ label: string; route: string }>; faqKeywords: string[] }> = {
  'Super Administrator': {
    responsibilities: [
      'Manage system-level configuration and administrative settings.',
      'Review core operational areas such as users, roles, permissions, and system setup.',
      'Support governance across inventory, borrowing, and reporting workflows.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Users', route: '/users' },
      { label: 'Roles', route: '/roles' },
      { label: 'System Setup', route: '/system-setup' },
      { label: 'Reports', route: '/reports' },
      { label: 'Documentation', route: '/documentation' },
    ],
    faqKeywords: ['system', 'setup', 'users', 'roles', 'reports', 'dashboard', 'administration', 'permissions'],
  },
  'System Administrator': {
    responsibilities: [
      'Maintain operational setup, departments, locations, and administrative configuration.',
      'Manage user access and system administration tasks across core pages.',
      'Support day-to-day operational continuity in inventory and borrowing workflows.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'System Setup', route: '/system-setup' },
      { label: 'Users', route: '/users' },
      { label: 'Roles', route: '/roles' },
      { label: 'Reports', route: '/reports' },
      { label: 'Documentation', route: '/documentation' },
    ],
    faqKeywords: ['system', 'setup', 'users', 'roles', 'reports', 'dashboard', 'administration', 'permissions'],
  },
  'Property Custodian': {
    responsibilities: [
      'Manage property custody and asset accountability.',
      'Review and support asset and borrowing-related operational tasks.',
      'Help maintain asset readiness and correct custody records.',
    ],
    links: [
      { label: 'Assets', route: '/assets' },
      { label: 'Borrowings', route: '/borrowings' },
      { label: 'Inventory', route: '/inventory' },
      { label: 'QR Scanner', route: '/qr' },
      { label: 'Reports', route: '/reports' },
    ],
    faqKeywords: ['asset', 'assets', 'borrow', 'borrowing', 'inventory', 'qr', 'return', 'custody'],
  },
  'Inventory Officer': {
    responsibilities: [
      'Manage inventory items, stock records, and related workflows.',
      'Support asset and borrowing processes from issue through return.',
      'Use reporting and operational views to keep inventories accurate.',
    ],
    links: [
      { label: 'Inventory', route: '/inventory' },
      { label: 'Assets', route: '/assets' },
      { label: 'Borrowings', route: '/borrowings' },
      { label: 'QR Scanner', route: '/qr' },
      { label: 'Reports', route: '/reports' },
    ],
    faqKeywords: ['inventory', 'asset', 'assets', 'borrow', 'borrowing', 'return', 'qr', 'stock', 'report'],
  },
  'Department Head': {
    responsibilities: [
      'Review and authorize departmental requests and approvals.',
      'Monitor borrowing and operational activity relevant to the department.',
      'Support team access to the relevant operational pages.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Borrowings', route: '/borrowings' },
      { label: 'Reservations', route: '/reservations' },
      { label: 'Reports', route: '/reports' },
      { label: 'Users', route: '/users' },
    ],
    faqKeywords: ['department', 'borrow', 'borrowing', 'reservation', 'reports', 'request', 'approval'],
  },
  'Supply Officer': {
    responsibilities: [
      'Manage general office supply inventory and consumable stock levels.',
      'Monitor quantity and availability for general supply items through the existing inventory workflow.',
      'Maintain accurate supply records and support everyday replenishment needs using the current inventory tools.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Inventory', route: '/inventory' },
      { label: 'Assets', route: '/assets' },
      { label: 'Reports', route: '/reports' },
    ],
    faqKeywords: ['inventory', 'supply', 'general', 'consumable', 'stock', 'replenishment', 'asset'],
  },
  'Employee': {
    responsibilities: [
      'Request and manage routine borrowing activity.',
      'View relevant assets and return items as required.',
      'Use the QR scanner and operational pages relevant to personal requests.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Borrowings', route: '/borrowings' },
      { label: 'Assets', route: '/assets' },
      { label: 'Reservations', route: '/reservations' },
      { label: 'QR Scanner', route: '/qr' },
    ],
    faqKeywords: ['borrow', 'borrowing', 'asset', 'assets', 'reservation', 'reservation', 'qr', 'return', 'issued'],
  },
  Auditor: {
    responsibilities: [
      'Review asset and borrowing records for audit and oversight.',
      'Use reports and historical views to validate operational activity.',
      'Support compliance and accountability through system reporting.',
    ],
    links: [
      { label: 'Reports', route: '/reports' },
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Borrowings', route: '/borrowings' },
      { label: 'Assets', route: '/assets' },
      { label: 'Users', route: '/users' },
    ],
    faqKeywords: ['audit', 'reports', 'history', 'asset', 'borrow', 'borrowing', 'records', 'oversight'],
  },
}

function normalizeRoleName(name: string | undefined | null): string {
  return name?.trim() || ''
}

function getRoleProfile(roleName: string) {
  return ROLE_PROFILES[roleName] ?? {
    responsibilities: [
      'Use the application areas relevant to your assigned responsibilities.',
      'Review Help & FAQ for the steps needed for a specific workflow.',
    ],
    links: [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Help & FAQ', route: '/dashboard' },
    ],
    faqKeywords: ['help', 'dashboard', 'general'],
  }
}

function getRoleFaqMatches(roleName: string, faqEntries: FAQItem[]) {
  const profile = getRoleProfile(roleName)
  return faqEntries.filter((faq) => {
    const haystack = [faq.question, faq.answer, faq.category || '', (faq.keywords || []).join(' '), faq.destination || '', (faq.actions || []).map((action) => `${action.label} ${action.target}`).join(' ')].join(' ').toLowerCase()
    return profile.faqKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
  })
}

export default function HelpAccessibilityHub({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [active, setActive] = useState<HubTab>('Help & FAQ')
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(getPreferences())
  const [faqQuery, setFaqQuery] = useState('')
  const [faqCategory, setFaqCategory] = useState<string | null>(null)
  const [faqEntries, setFaqEntries] = useState<FAQItem[]>([])
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqError, setFaqError] = useState<string | null>(null)
  const userRoles = useMemo(() => user?.roles ?? [], [user])
  const userRoleNames = useMemo(() => Array.from(new Set(userRoles.map((role) => normalizeRoleName(role.name)).filter(Boolean))), [userRoles])
  /** Only admins with manage faqs permission see the Documentation tab. */
  const canManageFaq = hasPermission(user, 'manage faqs')
  const tabs: HubTab[] = useMemo(() => (canManageFaq ? [...baseTabs, 'Documentation'] : [...baseTabs]), [canManageFaq])

  const loadFaqEntries = async () => {
    try {
      setFaqLoading(true)
      setFaqError(null)
      const entries = await faqService.getFaqs()
      setFaqEntries(entries)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load FAQs.'
      setFaqError(message)
      setFaqEntries([])
    } finally {
      setFaqLoading(false)
    }
  }

  useEffect(() => {
    setPrefs(getPreferences())
    if (open) {
      void loadFaqEntries()
    }
  }, [open])

  const visibleFaq = useMemo(() => {
    return faqEntries.filter((item) => {
      const isPublished = item.active !== false && item.published !== false
      if (!isPublished) return false
      if (!item.roles || item.roles.length === 0) return true
      if (!userRoles.length) return false
      return item.roles.some((roleName) => userRoles.some((role) => role.name === roleName))
    })
  }, [faqEntries, userRoles])

  const roleCards = useMemo(() => userRoleNames.map((roleName) => {
    const profile = getRoleProfile(roleName)
    return {
      name: roleName,
      responsibilities: profile.responsibilities,
      links: profile.links,
      relatedFaqs: getRoleFaqMatches(roleName, visibleFaq),
    }
  }), [userRoleNames, visibleFaq])

  const faqCategories = useMemo(
    () => Array.from(new Set(visibleFaq.map((f) => f.category || 'General'))),
    [visibleFaq]
  )

  const currentContext = useMemo(() => getFaqRouteContext(location.pathname), [location.pathname])

  const filteredFaq = useMemo(() => {
    const matches = visibleFaq.filter((f) => {
      if (faqCategory && (f.category || 'General') !== faqCategory) return false
      if (!faqQuery) return true
      const q = faqQuery.toLowerCase()
      const haystack = [f.question, f.answer, (f.keywords || []).join(' '), (f.category || 'General')].join(' ').toLowerCase()
      return haystack.includes(q)
    })

    return matches.sort((a, b) => {
      const scoreA = getFaqContextRelevanceScore(a, location.pathname)
      const scoreB = getFaqContextRelevanceScore(b, location.pathname)
      if (scoreA !== scoreB) return scoreB - scoreA
      return 0
    })
  }, [visibleFaq, faqCategory, faqQuery, location.pathname])

  function updatePrefs(p: Partial<AccessibilityPreferences>) {
    setPreferences(p)
    setPrefs(getPreferences())
  }

  function handleFaqAction(action: FAQAction) {
    if (action.type !== 'route') return
    if (!action.target || action.target.startsWith('http')) return
    navigate(action.target)
    onClose()
  }

  return (
    <>
      <Modal open={open} title="Help & Accessibility" onClose={onClose} maxWidth={900}>
        <div>
          <nav aria-label="Help tabs" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActive(tab)} aria-pressed={active === tab} style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: active === tab ? '1px solid #0B3D91' : '1px solid #E2E8F0',
                background: active === tab ? '#EBF2FF' : '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}>{tab}</button>
            ))}
          </nav>

          <div>
            {active === 'Settings' && (
              <section aria-labelledby="settings-heading">
                <h3 id="settings-heading" style={{ fontWeight: 700 }}>Accessibility Settings</h3>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Font size</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updatePrefs({ fontSize: 'default' })} aria-pressed={prefs.fontSize === 'default'} style={{ padding: '8px 10px', borderRadius: 8, border: prefs.fontSize === 'default' ? '1px solid #0B3D91' : '1px solid #E2E8F0' }}>Default</button>
                      <button onClick={() => updatePrefs({ fontSize: 'large' })} aria-pressed={prefs.fontSize === 'large'} style={{ padding: '8px 10px', borderRadius: 8, border: prefs.fontSize === 'large' ? '1px solid #0B3D91' : '1px solid #E2E8F0' }}>Large</button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>High contrast</div>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={prefs.highContrast} onChange={(e) => updatePrefs({ highContrast: e.target.checked })} />
                      <span>Increase contrast for colors and borders</span>
                    </label>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Reduced motion</div>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={prefs.reducedMotion} onChange={(e) => updatePrefs({ reducedMotion: e.target.checked })} />
                      <span>Disable non-essential animations and transitions</span>
                    </label>
                  </div>

                  <div style={{ color: '#475569', fontSize: 13 }}>
                    Settings are stored locally in your browser and apply across pages. They do not change your account on the server.
                  </div>
                </div>
              </section>
            )}

            {active === 'Help & FAQ' && (
              <section aria-labelledby="faq-heading">
                <h3 id="faq-heading" style={{ fontWeight: 700 }}>Help & FAQ</h3>

                {canManageFaq && (
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#475569', fontSize: 13 }}>You have administrative access to manage these Help & FAQ entries.</div>
                    <button onClick={() => { navigate('/faqs'); onClose() }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 700, cursor: 'pointer', color: '#0F172A' }}>
                      Go to FAQ Management
                    </button>
                  </div>
                )}

                {faqError && (
                  <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{faqError}</div>
                )}


                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input aria-label="Search FAQ" value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} placeholder="Search FAQ" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                      <select aria-label="Category filter" value={faqCategory || ''} onChange={(e) => setFaqCategory(e.target.value || null)} style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <option value="">All</option>
                        {faqCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>

                    {faqLoading ? (
                      <div style={{ marginTop: 12, color: '#475569' }}>Loading FAQs…</div>
                    ) : (
                      <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredFaq.map((item) => {
                          const isRelevant = getFaqContextRelevanceScore(item, location.pathname) > 0
                          return (
                            <li key={String(item.id)} style={{ border: '1px solid #EEF2F7', padding: 12, borderRadius: 8 }}>
                              <details>
                                <summary style={{ fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                  <span>{item.question}</span>
                                  {isRelevant && (
                                    <span style={{ fontSize: 11, color: '#0B3D91', background: '#EBF2FF', border: '1px solid #C7D7FF', borderRadius: 999, padding: '3px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      Recommended for this page
                                    </span>
                                  )}
                                </summary>
                                <div style={{ marginTop: 8, color: '#334155', lineHeight: 1.6 }}>{item.answer}</div>
                                {item.actions && item.actions.length > 0 && (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                    {item.actions.map((action) => (
                                      <button key={`${String(item.id)}-${action.label}`} onClick={() => handleFaqAction(action)} style={{ padding: '7px 10px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 700 }}>
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </details>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  <aside style={{ width: 260, borderLeft: '1px solid #EEF2F7', paddingLeft: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick topics</div>
                    <div style={{ marginBottom: 8, color: '#475569', fontSize: 12 }}>Recommended for {currentContext.label}</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[...visibleFaq].sort((a, b) => getFaqContextRelevanceScore(b, location.pathname) - getFaqContextRelevanceScore(a, location.pathname)).slice(0, 6).map((item) => (
                        <li key={String(item.id)}><button onClick={() => { setFaqQuery(''); setFaqCategory(item.category || 'General'); setActive('Help & FAQ') }} style={{ background: 'transparent', border: 'none', padding: 0, color: '#0B3D91', cursor: 'pointer' }}>{item.question}</button></li>
                      ))}
                    </ul>
                  </aside>
                </div>
              </section>
            )}

            {active === 'My Role' && (
              <section aria-labelledby="role-heading">
                <h3 id="role-heading" style={{ fontWeight: 700 }}>My Role</h3>
                <div style={{ marginTop: 12 }}>
                  {user ? (
                    <div>
                      <div style={{ marginBottom: 8 }}><strong>Signed in as:</strong> {user.full_name || user.name || user.email}</div>
                      <div style={{ marginBottom: 12 }}><strong>Roles:</strong> {userRoleNames.length > 0 ? userRoleNames.join(', ') : 'No role information available'}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {roleCards.length > 0 ? roleCards.map((roleCard) => {
                          const uniqueLinks = Array.from(new Map(roleCard.links.map((link) => [link.route, link])).values())
                          const uniqueFaqs = Array.from(new Map(roleCard.relatedFaqs.map((faq) => [String(faq.id), faq])).values())

                          return (
                            <div key={roleCard.name} style={{ border: '1px solid #EEF2F7', padding: 12, borderRadius: 8 }}>
                              <div style={{ fontWeight: 800, marginBottom: 8 }}>{roleCard.name}</div>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>Typical responsibilities</div>
                              <ul style={{ margin: '0 0 12px 18px', padding: 0, color: '#475569', display: 'grid', gap: 4 }}>
                                {roleCard.responsibilities.map((responsibility) => (
                                  <li key={responsibility}>{responsibility}</li>
                                ))}
                              </ul>

                              <div style={{ fontWeight: 700, marginBottom: 6 }}>Relevant pages</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                {uniqueLinks.map((link) => (
                                  <button
                                    key={`${roleCard.name}-${link.route}`}
                                    type="button"
                                    onClick={() => { navigate(link.route); onClose() }}
                                    style={{ padding: '7px 10px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    {link.label}
                                  </button>
                                ))}
                              </div>

                              <div style={{ fontWeight: 700, marginBottom: 6 }}>Related Help & FAQ</div>
                              {uniqueFaqs.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {uniqueFaqs.slice(0, 3).map((faq) => (
                                    <button
                                      key={`${roleCard.name}-${String(faq.id)}`}
                                      type="button"
                                      onClick={() => {
                                        setActive('Help & FAQ')
                                        setFaqQuery(faq.question)
                                        setFaqCategory(faq.category || 'General')
                                      }}
                                      style={{ textAlign: 'left', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#0B3D91', fontWeight: 700 }}
                                    >
                                      {faq.question}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ color: '#475569' }}>No matching Help & FAQ entries are currently visible for this role.</div>
                              )}
                            </div>
                          )
                        }) : (
                          <div style={{ color: '#475569' }}>No role information available. Your capabilities depend on the permissions granted by your administrator.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#475569' }}>Not signed in.</div>
                  )}
                </div>
              </section>
            )}

            {active === 'Diagnostics' && (
              <section aria-labelledby="diag-heading">
                <h3 id="diag-heading" style={{ fontWeight: 700 }}>Diagnostics</h3>
                <div style={{ marginTop: 12 }}>
                  <AccessibilityQaPanel inline />
                </div>
              </section>
            )}

            {active === 'Documentation' && canManageFaq && (
              <section aria-labelledby="documentation-heading">
                <h3 id="documentation-heading" style={{ fontWeight: 700 }}>Documentation</h3>
                <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                  <div style={{ border: '1px solid #EEF2F7', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>System documentation</div>
                    <div style={{ color: '#475569', lineHeight: 1.7 }}>
                      This section is intended for System Administrator and Super Administrator use. It summarizes the verified operating model, core routes, RBAC boundaries, and the business workflows currently implemented by the application.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
                    {VERIFIED_ROUTE_OPTIONS.map((option) => (
                      <button key={option.value} onClick={() => { navigate(option.value); onClose() }} style={{ padding: '10px 12px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 700, color: '#1D4ED8', textAlign: 'left' }}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    </>
  )
}



