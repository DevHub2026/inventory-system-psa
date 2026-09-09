import { useState } from 'react'
import { ArrowRight, BarChart3, Building2, ChevronLeft, LockKeyhole, ShieldCheck, TimerReset } from 'lucide-react'
import logo from '../assets/logo.png'
import LoginForm from '../components/LoginForm'
import { Modal } from '@/components/ui'
import { PrivacyNoticePage } from './PrivacyNoticePage'

function Feature({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: string }) {
  return (
    <div className="auth-feature">
      <span className="auth-feature-icon" aria-hidden="true"><Icon size={21} strokeWidth={1.8} /></span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </div>
  )
}

export default function LoginPage() {
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <main className="auth-page">
      <section className="auth-login-panel" aria-labelledby="login-heading">
        <button className="auth-back-button" type="button" aria-label="Go back" onClick={() => window.history.back()}>
          <ChevronLeft size={18} />
        </button>
        <div className="auth-login-inner">
          <header className="auth-official-header">
            <img src={logo} alt="Philippine Statistics Authority seal" className="auth-official-logo" />
            <div>
              <p className="auth-agency-name">Philippine Statistics Authority</p>
              <p className="auth-system-name">REGION XII · INVENTORY SYSTEM</p>
              <div className="auth-tricolor" aria-hidden="true"><span /><span /><span /></div>
            </div>
          </header>

          <div className="auth-heading-block">
            <h1 id="login-heading">Sign In</h1>
            <p>Secure your access to the PSA Region XII<br className="auth-desktop-break" /> Inventory Management System.</p>
          </div>

          <LoginForm />

          <div className="auth-trust-footer">
            <LockKeyhole size={17} aria-hidden="true" />
            <div><p>This is a secure and private system.</p><strong>Philippine Statistics Authority · Region XII</strong></div>
          </div>
          <button type="button" onClick={() => setShowPrivacy(true)} className="auth-privacy-link">Privacy Notice</button>
        </div>
        <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Notice" maxWidth={900}><PrivacyNoticePage /></Modal>
      </section>

      <section className="auth-brand-panel" aria-label="About the PSA Region XII Inventory Management System">
        <div className="auth-brand-pattern" aria-hidden="true" />
        <div className="auth-brand-content">
          <div className="auth-brand-intro"><span className="auth-brand-kicker">PSA REGION XII</span><h2>Better stewardship<br />through better data.</h2><p>A trusted platform for managing government assets with clarity, accountability, and purpose.</p></div>
          <div className="auth-showcase-card">
            <div className="auth-showcase-image"><div className="auth-image-placeholder"><Building2 size={36} aria-hidden="true" /><span>Inventory Management</span></div></div>
            <div className="auth-showcase-copy"><span className="auth-showcase-icon"><BarChart3 size={22} /></span><h3>Inventory Management</h3><p>Track and manage government assets efficiently.</p></div>
          </div>
          <div className="auth-feature-list">
            <Feature icon={ShieldCheck} title="Secure">Data protection and access control.</Feature>
            <Feature icon={TimerReset} title="Efficient">Streamlined processes for better service.</Feature>
            <Feature icon={BarChart3} title="Transparent">Accountability through real-time reporting.</Feature>
          </div>
          <div className="auth-panel-footer"><span>Supporting data-driven decisions for a stronger, more responsive Philippines.</span><ArrowRight size={20} aria-hidden="true" /></div>
        </div>
        <footer className="auth-footer">© 2025 Philippine Statistics Authority. All rights reserved.</footer>
      </section>
    </main>
  )
}
