import logo from '../assets/logo.png'
import LoginForm from '../components/LoginForm'

function DotGrid({ className }: { className: string }) {
  return (
    <div className={`auth-dot-grid ${className}`} aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => <span key={i} />)}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="auth-page">

      {/* ── Left: PSA blue branding panel ───────────────── */}
      <section className="auth-brand-panel" aria-label="Philippine Statistics Authority">
        <DotGrid className="auth-dot-grid--brand" />
        <div className="auth-brand-glow" aria-hidden="true" />

        <div className="auth-brand-content">
          <img
            src={logo}
            alt="Philippine Statistics Authority"
            className="auth-brand-logo"
          />
          <h1 className="auth-brand-title">
            <span>Philippine</span>
            <span>Statistics</span>
            <span>Authority</span>
          </h1>
          <div className="auth-brand-bars" aria-hidden="true">
            <span /><span /><span />
          </div>
          <p className="auth-brand-tagline">
            Solid&nbsp;<b>•</b>&nbsp;Responsive&nbsp;<b>•</b>&nbsp;World-class
          </p>
        </div>
      </section>

      {/* ── Right: login panel ──────────────────────────── */}
      <section className="auth-login-panel" aria-labelledby="login-heading">

        {/* Corner dot grids */}
        <DotGrid className="auth-dot-grid--top" />
        <DotGrid className="auth-dot-grid--bottom" />

        {/* PSA color accent — top-left corner strip */}
        <div className="auth-corner-accent auth-corner-accent--tl" aria-hidden="true">
          <span /><span /><span />
        </div>

        {/* PSA color accent — bottom-right corner strip */}
        <div className="auth-corner-accent auth-corner-accent--br" aria-hidden="true">
          <span /><span /><span />
        </div>

        {/* Floating color orbs — subtle background depth */}
        <div className="auth-orb auth-orb--blue"   aria-hidden="true" />
        <div className="auth-orb auth-orb--yellow" aria-hidden="true" />

        <div className="auth-card">
          <img src={logo} alt="" className="auth-card-logo" aria-hidden="true" />
          <div className="auth-card-header">
            <h2 id="login-heading">Philippine Statistics Authority</h2>
            <div className="auth-subtitle">
              <span />
              <p>Inventory&nbsp;Management&nbsp;System</p>
              <span />
            </div>
          </div>
          <LoginForm />
        </div>

        <footer className="auth-footer">
          © 2028 Philippine Statistics Authority. All rights reserved.
        </footer>
      </section>

    </main>
  )
}
