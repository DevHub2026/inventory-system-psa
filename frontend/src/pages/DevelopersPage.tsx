import { teamMembers, type TeamMember } from '@/data/developers'
import psaLogo from '@/assets/logo.png'

// ─── Logo imports ─────────────────────────────────────────────────────────────
const rmmcMod = import.meta.glob('../assets/rmmc-logo.png', { eager: true }) as Record<string, { default: string }>
const citeMod  = import.meta.glob('../assets/cite-logo.png', { eager: true }) as Record<string, { default: string }>
const rmmcLogo: string | undefined = Object.values(rmmcMod)[0]?.default
const citeLogo: string | undefined = Object.values(citeMod)[0]?.default

// ─── PSA Brand Colors ─────────────────────────────────────────────────────────
const PSA = {
  blue: '#003DA5',
  blueLight: '#1A6FD4',
  yellow: '#FFD400',
  red: '#E31C23',
  surface: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
}

// ─── Decorative dot pattern ────────────────────────────────────────────────────
function DotPattern() {
  return (
    <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="#003DA5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}

// ─── Team Avatar ──────────────────────────────────────────────────────────────
function TeamAvatar({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(' ')
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F1F5F9',
      }}>
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 28, fontWeight: 800, color: '#94A3B8' }}>{initials}</span>
        )}
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B' }}>
        {member.name}
      </span>
    </div>
  )
}

// ─── Institution Logo ─────────────────────────────────────────────────────────
function InstLogo({ src, fallback, name, size = 64 }: { src?: string; fallback: string; name: string; size?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 88, height: 88, borderRadius: 16,
      background: 'transparent', border: 'none',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      {src ? (
        <img src={src} alt={name} style={{ width: size, height: size, objectFit: 'contain', background: 'transparent' }} />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 900, color: '#94A3B8' }}>{fallback}</span>
      )}
    </div>
  )
}

// ─── Tech Badge ────────────────────────────────────────────────────────────────
function TechBadge({ label, icon }: { label: string; icon?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 14px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, color: '#475569',
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s',
      cursor: 'default',
    }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function DevelopersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* ── Main Team Card ── */}
      <div style={{
        borderRadius: 20, background: PSA.surface,
        border: `1px solid ${PSA.border}`,
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden', position: 'relative',
      }}>
        <DotPattern />

        {/* PSA tri-color top accent */}
        <div style={{ height: 5, display: 'flex', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${PSA.blue}, #002A75)` }} />
          <div style={{ flex: 1, background: PSA.yellow }} />
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${PSA.red}, #B71C1C)` }} />
        </div>

        <div style={{ padding: '36px 36px 32px', position: 'relative', zIndex: 1 }}>

          {/* Institution logos row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
            <InstLogo src={rmmcLogo} fallback="RMMC" name="Ramon Magsaysay Memorial Colleges" />
            <InstLogo src={psaLogo} fallback="PSA" name="Philippine Statistics Authority" size={80} />
            <InstLogo src={citeLogo} fallback="CITE" name="College of Information Technology Education" />
          </div>

          {/* Decorative divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #E2E8F0)' }} />
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: PSA.blue, flexShrink: 0,
            }} />
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: PSA.yellow, flexShrink: 0,
            }} />
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: PSA.red, flexShrink: 0,
            }} />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #E2E8F0)' }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 14px', borderRadius: 20,
              fontSize: 10.5, fontWeight: 700, color: PSA.blue,
              background: `linear-gradient(135deg, #EFF6FF, #DBEAFE)`,
              border: '1px solid #BFDBFE',
              marginBottom: 12, letterSpacing: '0.02em',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={PSA.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
              OJT Development Team
            </div>
            <h1 style={{
              fontSize: 26, fontWeight: 800, margin: 0,
              color: PSA.text, letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}>
              Meet the Team
            </h1>
            <p style={{
              fontSize: 13, color: '#94A3B8', margin: '6px 0 0',
              lineHeight: 1.4,
            }}>
              The people behind this system
            </p>
          </div>

          {/* Team member avatars row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 48,
            marginBottom: 32, flexWrap: 'wrap',
          }}>
            {teamMembers.map((member) => (
              <TeamAvatar key={member.id} member={member} />
            ))}
          </div>

          {/* Description */}
          <div style={{
            background: 'linear-gradient(135deg, #FAFBFC, #F8FAFC)',
            borderRadius: 14, border: '1px solid #F1F5F9',
            padding: '24px 28px', marginBottom: 24,
            position: 'relative',
          }}>
            {/* Top-left quote accent */}
            <div style={{
              position: 'absolute', top: 12, left: 16,
              fontSize: 32, lineHeight: 1, fontWeight: 800, color: '#E2E8F0',
              fontFamily: 'Georgia, serif',
            }}>
              &ldquo;
            </div>
            <p style={{
              fontSize: 13, color: '#475569', lineHeight: 1.8,
              margin: 0, textAlign: 'center',
              padding: '0 12px',
            }}>
              This system was developed by three Computer Science students from{' '}
              <strong style={{ color: '#003DA5' }}>Ramon Magsaysay Memorial Colleges, Inc. (RMMC)</strong> –{' '}
              <strong style={{ color: '#DC2626' }}>College of Information Technology Education</strong>{' '}
              during their On-the-Job Training (OJT) at the{' '}
              <strong style={{ color: '#CA8A04' }}>Philippine Statistics Authority (PSA) Region XII</strong>.{' '}
              As part of their learning experience, they worked closely together to design and build a practical inventory management system that supports asset tracking, borrowing, maintenance scheduling, and inventory reporting. Through teamwork, continuous learning, and guidance from their mentors, they were able to create a solution that they hope will make everyday office processes more organized and efficient.
            </p>
          </div>

          {/* Tech stack */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <TechBadge label="Laravel" />
            <TechBadge label="React" />
            <TechBadge label="TypeScript" />
            <TechBadge label="PostgreSQL" />
            <TechBadge label="RBAC" />
            <TechBadge label="Sanctum Auth" />
            <TechBadge label="PWA" />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderRadius: 14, background: PSA.surface,
        border: `1px solid ${PSA.border}`,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {rmmcLogo && <img src={rmmcLogo} alt="RMMC" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
          {citeLogo && <img src={citeLogo} alt="CITE" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PSA.text, lineHeight: 1.3 }}>
              Ramon Magsaysay Memorial Colleges, Inc.
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', lineHeight: 1.3 }}>
              College of Information Technology Education · General Santos City, Philippines
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: PSA.text }}>
            PSA — Inventory Management System
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
            OJT · Philippine Statistics Authority, Region XII
          </div>
        </div>
      </div>
    </div>
  )
}
