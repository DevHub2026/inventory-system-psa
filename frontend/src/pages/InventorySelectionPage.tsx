import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Package, ArrowRight, LayoutGrid } from 'lucide-react'

/* ─────────────────────────────────────────────
   Non-Expendable illustration
   Desk setup: monitor + keyboard + device stack
───────────────────────────────────────────── */
function NonExpendableIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 120"
      fill="none"
      aria-hidden="true"
      style={{ width: 160, height: 120 }}
    >
      {/* desk surface */}
      <rect x="8" y="98" width="144" height="8" rx="4" fill="#BFDBFE" />

      {/* monitor stand base */}
      <rect x="68" y="90" width="24" height="8" rx="3" fill="#93C5FD" />
      {/* monitor stand pole */}
      <rect x="77" y="72" width="6" height="20" rx="3" fill="#60A5FA" />
      {/* monitor body */}
      <rect x="34" y="28" width="92" height="56" rx="8" fill="#1E40AF" />
      {/* monitor bezel */}
      <rect x="38" y="32" width="84" height="46" rx="6" fill="#1D4ED8" />
      {/* screen */}
      <rect x="42" y="36" width="76" height="38" rx="4" fill="#EFF6FF" />
      {/* screen content — window bars */}
      <rect x="46" y="40" width="48" height="4" rx="2" fill="#BFDBFE" />
      <rect x="46" y="47" width="36" height="3" rx="1.5" fill="#DBEAFE" />
      <rect x="46" y="53" width="42" height="3" rx="1.5" fill="#DBEAFE" />
      <rect x="46" y="59" width="28" height="3" rx="1.5" fill="#DBEAFE" />
      {/* screen — right panel accent */}
      <rect x="100" y="40" width="14" height="22" rx="3" fill="#BFDBFE" />
      <rect x="102" y="43" width="10" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="102" y="48" width="10" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="102" y="53" width="8" height="3" rx="1.5" fill="#93C5FD" />

      {/* keyboard */}
      <rect x="30" y="100" width="60" height="10" rx="4" fill="#DBEAFE" />
      <rect x="34" y="103" width="52" height="4" rx="2" fill="#BFDBFE" />

      {/* small device — right side (laptop/tablet silhouette) */}
      <rect x="104" y="84" width="38" height="26" rx="5" fill="#1E3A8A" />
      <rect x="107" y="87" width="32" height="18" rx="3" fill="#3B82F6" />
      <rect x="109" y="89" width="28" height="14" rx="2" fill="#DBEAFE" />
      <rect x="104" y="110" width="38" height="4" rx="2" fill="#1D4ED8" />

      {/* dot accent — top right */}
      <circle cx="148" cy="20" r="5" fill="#BFDBFE" />
      <circle cx="142" cy="12" r="3" fill="#DBEAFE" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Expendable illustration
   Open box with office supplies spilling out
───────────────────────────────────────────── */
function ExpendableIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 120"
      fill="none"
      aria-hidden="true"
      style={{ width: 160, height: 120 }}
    >
      {/* box body */}
      <rect x="24" y="62" width="112" height="52" rx="8" fill="#D1FAE5" />
      {/* box front stripe */}
      <rect x="24" y="80" width="112" height="4" rx="2" fill="#A7F3D0" />

      {/* left box flap (open) */}
      <path d="M24 62 L12 38 L62 38 L62 62 Z" fill="#A7F3D0" />
      <rect x="34" y="44" width="20" height="3" rx="1.5" fill="#6EE7B7" />

      {/* right box flap (open) */}
      <path d="M136 62 L148 38 L98 38 L98 62 Z" fill="#A7F3D0" />
      <rect x="104" y="44" width="20" height="3" rx="1.5" fill="#6EE7B7" />

      {/* ream of paper — inside box */}
      <rect x="36" y="52" width="30" height="22" rx="3" fill="#F8FAFC" />
      <rect x="36" y="52" width="30" height="4" rx="2" fill="#E2E8F0" />
      <rect x="38" y="58" width="26" height="2" rx="1" fill="#E2E8F0" />
      <rect x="38" y="62" width="26" height="2" rx="1" fill="#E2E8F0" />
      <rect x="38" y="66" width="26" height="2" rx="1" fill="#E2E8F0" />

      {/* toner cartridge — standing in box */}
      <rect x="76" y="42" width="22" height="34" rx="6" fill="#059669" />
      <rect x="78" y="38" width="18" height="8" rx="4" fill="#34D399" />
      <rect x="80" y="50" width="14" height="3" rx="1.5" fill="#A7F3D0" />
      <rect x="80" y="56" width="14" height="2" rx="1" fill="#A7F3D0" />
      <rect x="80" y="61" width="10" height="2" rx="1" fill="#A7F3D0" />

      {/* pencil — leaning out of box */}
      <rect
        x="107" y="24" width="8" height="42" rx="3"
        fill="#FCD34D"
        transform="rotate(15 111 45)"
      />
      <polygon
        points="107,62 115,62 111,72"
        fill="#F59E0B"
        transform="rotate(15 111 62)"
      />
      <rect
        x="107" y="24" width="8" height="8" rx="2"
        fill="#FCA5A5"
        transform="rotate(15 111 28)"
      />

      {/* folder — leaning left */}
      <rect
        x="30" y="30" width="28" height="34" rx="4"
        fill="#FDE68A"
        transform="rotate(-12 44 47)"
      />
      <rect
        x="30" y="30" width="28" height="6" rx="3"
        fill="#FCD34D"
        transform="rotate(-12 44 33)"
      />

      {/* dot accents */}
      <circle cx="148" cy="18" r="5" fill="#D1FAE5" />
      <circle cx="142" cy="10" r="3" fill="#A7F3D0" />
      <circle cx="14" cy="24" r="4" fill="#D1FAE5" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Stat badge — small pill shown on each card
───────────────────────────────────────────── */
function StatBadge({ label, accent }: { label: string; accent: 'blue' | 'green' }) {
  const isBlue = accent === 'blue'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: isBlue ? '#EFF6FF' : '#F0FDF4',
        color: isBlue ? '#1E40AF' : '#065F46',
        border: `1px solid ${isBlue ? '#BFDBFE' : '#A7F3D0'}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isBlue ? '#3B82F6' : '#10B981',
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Feature row — three tiny bullet points
───────────────────────────────────────────── */
function FeatureList({ items, accent }: { items: string[]; accent: 'blue' | 'green' }) {
  const isBlue = accent === 'blue'
  const dotColor = isBlue ? '#3B82F6' : '#10B981'
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

/* ─────────────────────────────────────────────
   Main card component
───────────────────────────────────────────── */
interface CardProps {
  accent: 'blue' | 'green'
  badge: string
  illustration: React.ReactNode
  title: string
  description: string
  features: string[]
  buttonLabel: string
  onClick: () => void
}

function InventoryCard({ accent, badge, illustration, title, description, features, buttonLabel, onClick }: CardProps) {
  const [hovered, setHovered] = useState(false)
  const isBlue = accent === 'blue'

  /* colour tokens */
  const accentPrimary   = isBlue ? '#1E3A8A' : '#065F46'
  const accentHover     = isBlue ? '#1D4ED8' : '#047857'
  const titleColor      = isBlue ? '#0F172A' : '#0F172A'
  const topBg           = isBlue
    ? 'linear-gradient(140deg, #EFF6FF 0%, #DBEAFE 100%)'
    : 'linear-gradient(140deg, #F0FDF4 0%, #D1FAE5 100%)'
  const borderColor     = hovered
    ? (isBlue ? '#93C5FD' : '#6EE7B7')
    : '#E2E8F0'
  const shadow          = hovered
    ? '0 16px 48px rgba(0,0,0,0.12)'
    : '0 2px 12px rgba(0,0,0,0.06)'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={buttonLabel}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        flex: '1 1 0',
        minWidth: 300,
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 20,
        boxShadow: shadow,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.22s ease, border-color 0.22s ease, transform 0.18s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Illustrated top band ── */}
      <div
        style={{
          background: topBg,
          padding: '32px 36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative large circle behind illustration */}
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: isBlue
              ? 'rgba(219,234,254,0.5)'
              : 'rgba(209,250,229,0.5)',
            top: -40,
            right: -40,
            pointerEvents: 'none',
          }}
        />
        {/* badge */}
        <StatBadge label={badge} accent={accent} />
        {/* illustration */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {illustration}
        </div>
      </div>

      {/* ── Text body ── */}
      <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* title */}
        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 700,
            color: titleColor,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>

        {/* description */}
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            color: '#64748B',
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>

        {/* divider */}
        <div style={{ height: 1, background: '#F1F5F9', margin: '2px 0' }} />

        {/* feature bullets */}
        <FeatureList items={features} accent={accent} />

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* CTA button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentPrimary }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 44,
            paddingInline: 24,
            borderRadius: 10,
            border: 'none',
            background: accentPrimary,
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            transition: 'background 0.15s',
            boxShadow: `0 2px 8px ${isBlue ? 'rgba(30,58,138,0.25)' : 'rgba(6,95,70,0.25)'}`,
          }}
        >
          {buttonLabel}
          <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export function InventorySelectionPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <LayoutGrid size={13} style={{ color: '#94A3B8' }} aria-hidden="true" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Operations
          </span>
          <span style={{ fontSize: 11, color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Inventory
          </span>
        </div>

        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 26,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}
        >
          Inventory Management
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
          Select an inventory category below to manage items, track stock levels, and record movements.
        </p>
      </div>

      {/* ── Category cards ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        <InventoryCard
          accent="blue"
          badge="Non-Expendable"
          illustration={<NonExpendableIllustration />}
          title="Non-Expendable Inventory"
          description="Track durable government assets with long service life — equipment, devices, and physical property that are recorded, maintained, and not consumed during normal use."
          features={[
            'Computers, laptops, monitors, printers',
            'Furniture, office equipment, power devices',
            'Items linked to PSA asset records',
          ]}
          buttonLabel="View Non-Expendable"
          onClick={() => navigate('/inventory/non-expendable')}
        />

        <InventoryCard
          accent="green"
          badge="Expendable"
          illustration={<ExpendableIllustration />}
          title="Expendable Inventory"
          description="Manage consumable supplies and materials used up during day-to-day office operations — stock levels, reorder alerts, and movement history are tracked here."
          features={[
            'Bond paper, printer toner, ink cartridges',
            'Pens, folders, envelopes, office supplies',
            'Items consumed and replenished regularly',
          ]}
          buttonLabel="View Expendable"
          onClick={() => navigate('/inventory/expendable')}
        />
      </div>

      {/* ── Info strip ── */}
      <div
        style={{
          marginTop: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderRadius: 12,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <Package size={15} style={{ color: '#94A3B8', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
          Items added from each category are automatically tagged and separated — non-expendable items are also linked to the Assets module for full lifecycle tracking.
        </span>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 40,
          textAlign: 'center',
          fontSize: 12,
          color: '#CBD5E1',
          letterSpacing: '0.02em',
        }}
      >
        &copy; {new Date().getFullYear()} Philippine Statistics Authority &mdash; Region XII. All rights reserved.
      </div>
    </div>
  )
}
