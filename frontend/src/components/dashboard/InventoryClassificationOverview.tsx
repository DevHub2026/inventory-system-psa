/**
 * InventoryClassificationOverview
 *
 * Admin-only. Compact visualization of InventoryItem counts by PSA
 * classification: PPE, SE, and Supply.
 *
 * Data source: analytics.inventory_classification — three entries keyed by
 * the actual `classification` field on inventory_items, not by type, category,
 * or any proxy field.
 *
 * This is classification analytics — a plain item-count breakdown.
 * It is NOT stock-health. No reorder-level logic applies here.
 * PPE and SE are counted as accountable property items.
 * Supply items are counted as consumable supply items.
 * Supply Stock Health remains a separate, independent visualization.
 *
 * Renders as stacked horizontal proportion bars + per-row count rows,
 * reusing the existing DashboardDonutChart color tokens for classification
 * consistency across the Admin Dashboard.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import type { DashboardSeriesPoint } from '@/types'
import { EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui'

interface InventoryClassificationOverviewProps {
  /** Raw series from analytics.inventory_classification — real API data only */
  data?: DashboardSeriesPoint[]
  loading?: boolean
}

/** Canonical colors for each classification — consistent with the donut charts */
const CLASSIFICATION_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  PPE:           { bar: '#003DA5', bg: '#eff6ff', text: '#1e40af' },
  SE:            { bar: '#5B21B6', bg: '#f5f3ff', text: '#5b21b6' },
  Supply:        { bar: '#0F766E', bg: '#f0fdfa', text: '#0f766e' },
  Unclassified:  { bar: '#94A3B8', bg: '#f8fafc', text: '#475569' },
}
const FALLBACK_COLOR = { bar: '#94A3B8', bg: '#f8fafc', text: '#475569' }

function classificationColor(label: string) {
  return CLASSIFICATION_COLORS[label] ?? FALLBACK_COLOR
}

export function InventoryClassificationOverview({
  data,
  loading = false,
}: InventoryClassificationOverviewProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="Classification data unavailable"
        description="The dashboard backend needs updating to provide classification counts."
      />
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0 && data.every((d) => d.value === 0)) {
    return (
      <EmptyState
        title="No inventory items yet"
        description="Item counts by classification will appear here once records exist."
      />
    )
  }

  // Screen-reader summary
  const srSummary = data
    .map((d) => `${d.label}: ${d.value}`)
    .join(', ')

  return (
    <div style={{ width: '100%' }}>
      {/* SR-only text */}
      <p
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Inventory classification breakdown — {srSummary}. Total: {total}.
      </p>

      {/* Stacked proportion bar */}
      {total > 0 && (
        <div
          style={{
            display: 'flex',
            height: 8,
            borderRadius: 999,
            overflow: 'hidden',
            gap: 2,
            marginBottom: 16,
          }}
          aria-hidden="true"
        >
          {data.map((d) => {
            if (d.value === 0) return null
            const pct = (d.value / total) * 100
            const colors = classificationColor(d.label)
            return (
              <div
                key={d.label}
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: colors.bar,
                  borderRadius: 999,
                  minWidth: d.value > 0 ? 4 : 0,
                  transition: 'width 0.4s ease',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Per-classification rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d) => {
          const colors = classificationColor(d.label)
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0

          return (
            <div
              key={d.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: colors.bg,
                border: `1px solid ${colors.bar}18`,
              }}
            >
              {/* Color swatch */}
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colors.bar,
                  flexShrink: 0,
                }}
              />

              {/* Label */}
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.text,
                  lineHeight: 1.3,
                }}
              >
                {d.label === 'PPE'
                  ? 'PPE — Property, Plant & Equipment'
                  : d.label === 'SE'
                  ? 'SE — Semi-Expendable'
                  : d.label === 'Supply'
                  ? 'Supply — Consumables'
                  : d.label === 'Unclassified'
                  ? 'Unclassified — Pending manual review'
                  : d.label}
              </span>

              {/* Count + percentage */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: colors.bar,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {d.value}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    fontWeight: 400,
                  }}
                >
                  ({pct}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total footer */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          Total inventory items
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#1e293b',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {total}
        </span>
      </div>

      {/* Classification semantics note */}
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: '#94a3b8',
          lineHeight: 1.5,
        }}
      >
        ★ Counts reflect the{' '}
        <span style={{ fontWeight: 600 }}>classification</span> field on
        inventory records. Stock health is tracked separately for Supply only.
      </div>
    </div>
  )
}
