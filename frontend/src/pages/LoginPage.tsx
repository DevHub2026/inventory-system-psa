import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import logo from '../assets/logo.png'
import loginBg from '../assets/login-bg.jpg'
import arrowsVideo from '../assets/smol.mp4'
import LoginForm from '../components/LoginForm'
import { Modal } from '../components/ui'
import { PrivacyNoticePage } from './PrivacyNoticePage'

const showcaseSlides = [
  {
    eyebrow: 'Inventory Management',
    title: 'Know what you have. Plan what comes next.',
    description: 'Track and manage government assets with precision, clarity, and accountability.',
  },
  {
    eyebrow: 'PSA SarGen',
    title: 'Better data for better public service.',
    description: 'Supporting data-driven decisions for a stronger, more responsive Philippines.',
  },
  {
    eyebrow: 'Built for teams',
    title: 'Everything organized in one place.',
    description: 'Streamline workflows and keep every government asset visible and moving forward.',
  },
]

export default function LoginPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % showcaseSlides.length)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [activeSlide])

  const goToSlide = (direction: 'prev' | 'next') => {
    setActiveSlide((current) => (
      direction === 'prev'
        ? (current - 1 + showcaseSlides.length) % showcaseSlides.length
        : (current + 1) % showcaseSlides.length
    ))
  }

  const current = showcaseSlides[activeSlide]

  return (
    <main className="min-h-screen bg-[#edf5ff] p-4 text-[#102b67] sm:p-8 lg:p-12">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1420px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(29,78,153,0.14)] sm:min-h-[calc(100vh-4rem)] lg:min-h-[720px]">
        <div className="flex w-full flex-col justify-between px-6 py-7 sm:px-12 sm:py-10 lg:w-[52%] lg:px-16 lg:py-12 xl:px-24">
          <header className="flex items-center gap-4">
            <img src={logo} alt="PSA seal" className="size-14 shrink-0 object-contain" />
            <div>
              <p className="text-lg font-extrabold leading-tight tracking-[-0.03em] sm:text-xl">Philippine Statistics Authority</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#164aa6]">SarGen · Inventory System</p>
              <div className="mt-2 flex h-1 w-32 overflow-hidden rounded-full">
                <span className="w-1/3 bg-[#164aa6]" />
                <span className="w-1/3 bg-[#f5c400]" />
                <span className="w-1/3 bg-[#e62d3f]" />
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[500px] py-12 lg:py-6">
            <div className="mb-8">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2670db]">
                <Sparkles className="size-4" /> Welcome back
              </p>
              <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#102b67] sm:text-5xl">Sign in</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#6d85ad]">
                Secure your access to the PSA SarGen Inventory Management System.
              </p>
            </div>
            <LoginForm />
          </div>

          <footer className="flex items-end justify-between gap-4 border-t border-[#e4eefb] pt-5 text-[11px] text-[#7891b5]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 text-[#1260d4]" />
              <p>This is a secure and private system.<br /><strong className="text-[#164aa6]">Philippine Statistics Authority · SarGen</strong></p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setShowPrivacy(true)} className="text-[#7891b5] underline underline-offset-2 transition hover:text-[#164aa6]">Privacy Notice</button>
            </div>
          </footer>
        </div>

        <aside className="relative hidden w-[48%] overflow-hidden bg-[#092863] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="pointer-events-none absolute -right-24 bottom-[-90px] size-[380px] rounded-full border-[42px] border-white/10" />
          
          {/* Premium AI Generated 3D Arrows Video Background */}
          <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden mix-blend-screen opacity-90">
            <video
              src={arrowsVideo}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between text-white/90 drop-shadow-md">
            <p className="text-xs font-bold uppercase tracking-[0.24em]">Digital public service</p>
            <div className="flex gap-2"><span className="size-2 rounded-full bg-white" /><span className="size-2 rounded-full bg-[#f5c400]" /><span className="size-2 rounded-full bg-[#e62d3f]" /></div>
          </div>

          <div className="relative z-10 grid gap-7 xl:grid-cols-[1fr_0.8fr] xl:items-center">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <img src={loginBg} alt="PSA SarGen inventory system" className="h-40 w-full object-cover object-center" />
              <div className="p-6">
                <Building2 className="size-7 text-[#1260d4]" />
                <p className="mt-4 text-xl font-extrabold tracking-tight text-[#102b67]">{current.eyebrow}</p>
                <p className="mt-2 text-sm leading-5 text-[#6d85ad]">{current.description}</p>
              </div>
            </div>
            <div className="space-y-6 text-white">
              <Feature icon={<ShieldCheck />} title="Secure" text="Protected access and controlled data." />
              <Feature icon={<Zap />} title="Efficient" text="Streamlined workflows for better service." />
              <Feature icon={<BarChart3 />} title="Transparent" text="Accountability through real-time reporting." />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <button type="button" aria-label="Previous slide" onClick={() => goToSlide('prev')} className="flex size-11 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/20"><ArrowLeft className="size-5" /></button>
            <div className="flex items-center gap-2">
              {showcaseSlides.map((_, index) => (
                <button type="button" key={index} aria-label={`Go to slide ${index + 1}`} onClick={() => setActiveSlide(index)} className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/50'}`} />
              ))}
            </div>
            <button type="button" aria-label="Next slide" onClick={() => goToSlide('next')} className="flex size-11 items-center justify-center rounded-full bg-white text-[#1260d4] shadow-lg transition hover:bg-[#f5c400]"><ArrowRight className="size-5" /></button>
          </div>
        </aside>
      </section>
      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Notice" maxWidth={900}>
        <PrivacyNoticePage />
      </Modal>
    </main>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1260d4] shadow-md">{icon}</div>
      <div>
        <p className="font-bold text-white tracking-wide">{title}</p>
        <p className="mt-1 text-sm leading-5 text-white/95">{text}</p>
      </div>
    </div>
  )
}
