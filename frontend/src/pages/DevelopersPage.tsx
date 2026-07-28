import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import developers, { type Developer } from '@/data/developers'
import psaLogo from '@/assets/logo.png'

// ─── Logo imports ─────────────────────────────────────────────────────────────
const rmmcMod = import.meta.glob('../assets/rmmc-logo.png', { eager: true }) as Record<string, { default: string }>
const citeMod  = import.meta.glob('../assets/cite-logo.png', { eager: true }) as Record<string, { default: string }>
const rmmcLogo: string | undefined = Object.values(rmmcMod)[0]?.default
const citeLogo: string | undefined = Object.values(citeMod)[0]?.default

// ─── PSA Brand Colors ─────────────────────────────────────────────────────────
const PSA = {
  blue: '#003DA5',
  blueDark: '#002A75',
  blueLight: '#1A6FD4',
  yellow: '#FFD400',
  red: '#E31C23',
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
} as const

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Keyframes ────────────────────────────────────────────────────────────────
if (!document.getElementById('dev-kf')) {
  const s = document.createElement('style')
  s.id = 'dev-kf'
  s.textContent = `
    @keyframes devFadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(s)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ dev }: { dev: Developer }) {
  const initials = dev.name
    .split(' ')
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        flexShrink: 0,
        background: dev.avatar ? 'transparent' : `linear-gradient(135deg, ${PSA.blue}, ${PSA.blueLight})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 800,
        color: '#fff',
        boxShadow: `0 2px 8px rgba(0,61,165,0.25)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {dev.avatar ? (
        <img
          src={dev.avatar}
          alt={dev.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      ) : (
        <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
      )}
    </div>
  )
}

// ─── Role Tag ─────────────────────────────────────────────────────────────────
function RoleTag({ label, color }: { label: string; color: 'blue' | 'yellow' | 'red' }) {
  const colors = {
    blue: { bg: hexToRgba(PSA.blue, 0.08), text: PSA.blue, border: hexToRgba(PSA.blue, 0.2) },
    yellow: { bg: hexToRgba(PSA.yellow, 0.2), text: '#92400E', border: hexToRgba(PSA.yellow, 0.4) },
    red: { bg: hexToRgba(PSA.red, 0.08), text: PSA.red, border: hexToRgba(PSA.red, 0.2) },
  }
  const c = colors[color]
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: '3px 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ─── Developer Card ───────────────────────────────────────────────────────────
function DeveloperCard({ dev, index }: { dev: Developer; index: number }) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true)
          obs.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const tagColors: ('blue' | 'yellow' | 'red')[] = ['blue', 'yellow', 'red']

  return (
    <div
      ref={ref}
      style={{
        background: PSA.surface,
        borderRadius: 16,
        border: `1px solid ${PSA.border}`,
        boxShadow: '0 1px 8px rgba(0,61,165,0.06)',
        transition: 'all 0.25s ease',
        opacity: vis ? 1 : 0,
        animation: vis ? `devFadeUp 0.4s ease both` : 'none',
        animationDelay: `${index * 100}ms`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* PSA tri-color top bar */}
      <div
        style={{
          height: 4,
          display: 'flex',
        }}
      >
        <div style={{ flex: 1, background: PSA.blue }} />
        <div style={{ flex: 1, background: PSA.yellow }} />
        <div style={{ flex: 1, background: PSA.red }} />
      </div>

      {/* Card body */}
      <div style={{ padding: '24px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Avatar dev={dev} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: PSA.text,
                lineHeight: 1.25,
                marginBottom: 2,
              }}
            >
              {dev.name}
            </div>
            <div style={{ fontSize: 12, color: PSA.textMuted, lineHeight: 1.4 }}>{dev.role}</div>
          </div>
        </div>

        {/* Role tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {dev.roleTags.map((t, i) => (
            <RoleTag key={t} label={t} color={tagColors[i % tagColors.length]} />
          ))}
        </div>

        {/* Introduction */}
        <p
          style={{
            fontSize: 13,
            color: '#475569',
            lineHeight: 1.75,
            margin: 0,
            flex: 1,
          }}
        >
          {dev.introduction}
        </p>
      </div>
    </div>
  )
}

// ─── Institution Logo Block ───────────────────────────────────────────────────
function InstitutionLogo({ src, fallback, name }: { src?: string; fallback: string; name: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: 150,
        textAlign: 'center',
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: 80, height: 80, objectFit: 'contain' }} />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: hexToRgba(PSA.blue, 0.08),
            border: `2px solid ${hexToRgba(PSA.blue, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 900,
            color: PSA.blue,
          }}
        >
          {fallback}
        </div>
      )}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: PSA.textMuted,
          lineHeight: 1.45,
          textTransform: 'uppercase',
        }}
      >
        {name}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DevelopersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      <PageHeader title="Development Team" subtitle="Meet the developers behind this system." />

      {/* ══════════════════════════════════════════════════════
          HERO / ABOUT SECTION
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: 20,
          background: PSA.surface,
          border: `1px solid ${PSA.border}`,
          boxShadow: '0 1px 8px rgba(0,61,165,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* PSA tri-color top accent */}
        <div style={{ height: 4, display: 'flex' }}>
          <div style={{ flex: 1, background: PSA.blue }} />
          <div style={{ flex: 1, background: PSA.yellow }} />
          <div style={{ flex: 1, background: PSA.red }} />
        </div>

        <div style={{ padding: '36px 40px 32px' }}>
          {/* Institution logos row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 48,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <InstitutionLogo src={rmmcLogo} fallback="RMMC" name="Ramon Magsaysay Memorial Colleges, Inc." />
            <InstitutionLogo src={psaLogo} fallback="PSA" name="Philippine Statistics Authority" />
            <InstitutionLogo src={citeLogo} fallback="CITE" name="College of Information Technology Education" />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: PSA.border, marginBottom: 28 }} />

          {/* Text content */}
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            {/* Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: hexToRgba(PSA.blue, 0.06),
                border: `1px solid ${hexToRgba(PSA.blue, 0.15)}`,
                borderRadius: 24,
                padding: '4px 14px',
                fontSize: 11,
                fontWeight: 700,
                color: PSA.blue,
                marginBottom: 14,
                letterSpacing: '0.03em',
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              OJT Development Team
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                margin: '0 0 12px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: PSA.text,
              }}
            >
              Meet the Development Team
            </h1>

            <p
              style={{
                fontSize: 13.5,
                color: '#475569',
                lineHeight: 1.75,
                margin: '0 0 20px',
              }}
            >
              Three Computer Science students from{' '}
              <strong style={{ color: PSA.blue }}>
                Ramon Magsaysay Memorial Colleges, Inc. — College of Information Technology Education
              </strong>{' '}
              who built this system during their{' '}
              <strong style={{ color: PSA.text }}>On-the-Job Training (OJT)</strong> at the{' '}
              <strong style={{ color: PSA.text }}>Philippine Statistics Authority, Region XII</strong>.
            </p>

            {/* About card */}
            <div
              style={{
                background: '#F8FAFC',
                border: `1px solid ${PSA.border}`,
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  color: PSA.blue,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: hexToRgba(PSA.blue, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={PSA.blue}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                About This System
              </div>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                The{' '}
                <strong style={{ color: PSA.text }}>
                  PSA Region XII Office Asset, Equipment Reservation, Borrowing & Inventory Management System
                </strong>{' '}
                is a full-stack web application for asset tracking, borrowing workflows, maintenance scheduling,
                and inventory reporting — built with{' '}
                <strong style={{ color: PSA.text }}>Laravel, React, TypeScript, PostgreSQL</strong> and RBAC-based
                access control. It features a responsive Progressive Web App (PWA) interface with real-time inventory
                updates, automated maintenance reminders, role-based permission management, QR code asset scanning,
                detailed audit logging, and comprehensive reporting dashboards. The system streamlines PSA Region
                XII's equipment lifecycle management — from procurement tagging and assignment to reservation,
                borrowing, return, and disposal — ensuring accountability, transparency, and efficient resource
                utilization across all office departments.
              </p>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>, text: `${developers.length} Developers` },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, text: 'Laravel · React · TypeScript' },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: 'RBAC · Sanctum Auth' },
                { svg: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, text: 'Progressive Web App' },
              ].map(({ svg, text }, i) => (
                <div
                  key={text}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: i === 1 ? hexToRgba(PSA.yellow, 0.15) : '#F1F5F9',
                    border: `1px solid ${i === 1 ? hexToRgba(PSA.yellow, 0.3) : PSA.border}`,
                    borderRadius: 8,
                    padding: '5px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  <span style={{ color: PSA.blue, display: 'flex' }}>{svg}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DEVELOPER CARDS (3-column grid)
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}
      >
        {developers.map((dev, i) => (
          <DeveloperCard key={dev.id} dev={dev} index={i} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: 14,
          background: PSA.surface,
          border: `1px solid ${PSA.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 1px 4px rgba(0,61,165,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {rmmcLogo && (
            <img src={rmmcLogo} alt="RMMC" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          )}
          {citeLogo && (
            <img src={citeLogo} alt="CITE" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          )}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: PSA.blue, lineHeight: 1.3 }}>
              Ramon Magsaysay Memorial Colleges, Inc.
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: PSA.red, marginTop: 1 }}>
              College of Information Technology Education
            </div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>
              General Santos City, Philippines
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
            PSA — Inventory Management System
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
            OJT · Philippine Statistics Authority, Region XII
          </div>
        </div>
      </div>
    </div>
  )
}