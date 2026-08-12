import logo from '../assets/logo.png'
import LoginForm from '../components/LoginForm'
import { useState } from 'react'
import { Modal } from '@/components/ui'
import { PrivacyNoticePage } from './PrivacyNoticePage'

/* ── Floating SVG particles for the brand panel ── */
function Particles() {
  const dots = [
    { cx: '12%', cy: '18%', r: 2.5, op: 0.35, delay: '0s' },
    { cx: '28%', cy: '72%', r: 1.8, op: 0.25, delay: '0.8s' },
    { cx: '78%', cy: '14%', r: 3.2, op: 0.20, delay: '1.4s' },
    { cx: '68%', cy: '80%', r: 2.0, op: 0.30, delay: '0.4s' },
    { cx: '52%', cy: '50%', r: 1.4, op: 0.18, delay: '2s' },
    { cx: '88%', cy: '44%', r: 2.8, op: 0.22, delay: '1.1s' },
    { cx: '40%', cy: '28%', r: 1.6, op: 0.28, delay: '1.7s' },
    { cx: '18%', cy: '58%', r: 2.2, op: 0.20, delay: '0.6s' },
    { cx: '62%', cy: '36%', r: 1.2, op: 0.15, delay: '2.3s' },
    { cx: '84%', cy: '68%', r: 2.4, op: 0.25, delay: '0.2s' },
  ]
  return (
    <svg
      className="auth-particles"
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill="white"
          opacity={d.op}
          style={{ animationDelay: d.delay }}
          className="auth-particle"
        />
      ))}
    </svg>
  )
}

export default function LoginPage() {
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <main className="auth-page">

      {/* ══════════════════════════════════════
          LEFT — PSA Branding Panel
          ══════════════════════════════════════ */}
      <section className="auth-brand-panel" aria-label="Philippine Statistics Authority">

        {/* Animated particle field */}
        <Particles />

        {/* Large background rings — removed for cleaner look */}

        {/* Bottom wave */}
        <svg
          className="auth-wave"
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
            fill="rgba(255,255,255,0.04)"
          />
          <path
            d="M0,80 C480,20 960,100 1440,40 L1440,120 L0,120 Z"
            fill="rgba(255,255,255,0.03)"
          />
        </svg>

        {/* Brand content */}
        <div className="auth-brand-content">

          {/* Logo — clean, no bubble rings */}
          <div className="auth-logo-stack">
            <div className="auth-logo-ring">
              <img src={logo} alt="PSA seal" className="auth-brand-logo" />
            </div>
          </div>

          {/* Agency name */}
          <h1 className="auth-brand-title">
            <span>Philippine</span>
            <span>Statistics</span>
            <span>Authority</span>
          </h1>

          {/* Tri-colour rule */}
          <div className="auth-tricolor" aria-hidden="true">
            <span className="tc-blue" />
            <span className="tc-yellow" />
            <span className="tc-red" />
          </div>

          <p className="auth-brand-tagline">
            Solid&ensp;
            <span className="tc-dot tc-dot--blue" aria-hidden="true">●</span>
            &ensp;Responsive&ensp;
            <span className="tc-dot tc-dot--yellow" aria-hidden="true">●</span>
            &ensp;World-class
          </p>

          {/* System label pill */}
          <div className="auth-system-pill">
            <span className="auth-system-pill-dot" aria-hidden="true" />
            Inventory Management System
          </div>

          {/* Region badge */}
          <div className="auth-region-badge">Region XII</div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          RIGHT — Login Panel
          ══════════════════════════════════════ */}
      <section className="auth-login-panel" aria-labelledby="login-heading">

        {/* Background mesh */}
        <div className="auth-mesh" aria-hidden="true" />

        {/* Decorative blobs */}
        <div className="auth-blob auth-blob--1" aria-hidden="true" />
        <div className="auth-blob auth-blob--2" aria-hidden="true" />

        {/* Login card */}
        <div className="auth-card">

          {/* PSA tri-colour top strip */}
          <div className="auth-card-strip" aria-hidden="true">
            <span /><span /><span />
          </div>

          {/* Header */}
          <div className="auth-card-header">
            <img src={logo} alt="" className="auth-card-logo" aria-hidden="true" />
            <h2 id="login-heading" className="auth-card-title">
              Philippine Statistics Authority
            </h2>
            <p className="auth-card-sub">
              Region XII · Inventory System
            </p>
          </div>
          {/* Divider */}
          <div className="auth-card-divider" aria-hidden="true">
            <span />
            <span className="auth-card-divider-label">Sign in to continue</span>
            <span />
          </div>

          <LoginForm />

          {/* Security note */}
          <p className="auth-card-security">
            <svg
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure connection · PSA official portal
          </p>

        </div>

        <div className="auth-card-links" style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={() => setShowPrivacy(true)} className="underline text-sm text-slate-600" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Privacy Notice</button>
        </div>
        <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Notice" maxWidth={900}>
          <PrivacyNoticePage />
        </Modal>

        <footer className="auth-footer">
          © 2025 Philippine Statistics Authority. All rights reserved.
        </footer>
      </section>

    </main>
  )
}
