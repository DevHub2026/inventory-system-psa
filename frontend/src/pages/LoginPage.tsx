import { useState, useEffect, useCallback, useRef } from 'react'
import logo from '../assets/logo.png'
import LoginForm from '../components/LoginForm'
import { Modal } from '@/components/ui'
import { PrivacyNoticePage } from './PrivacyNoticePage'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Building2,
  Package,
  ArrowRight,
  ArrowLeft,
  Globe,
} from 'lucide-react'

/* ================================================================
   SHOWCASE CONFIGURATION
   ================================================================ */
interface ShowcaseSlide {
  image: string
  title: string
  description: string
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    image: '/login/showcase1.svg',
    title: 'Inventory Management',
    description: 'Track and manage government assets efficiently.',
  },
  {
    image: '/login/showcase2.svg',
    title: 'Secure Operations',
    description: 'Data protection and accountability through real-time reporting.',
  },
]

/* ================================================================
   THREE-ARROW ANIMATION (CSS-Driven, Restrained & Decorative)
   ================================================================ */
function AnimatedArrows() {
  return (
    <div className="absolute top-10 right-0 w-[450px] h-32 overflow-hidden pointer-events-none z-0 opacity-80" aria-hidden="true">
      <div className="w-full h-full flex items-center justify-end pr-10">
        <svg width="340" height="90" viewBox="0 0 340 90" fill="none" className="overflow-visible">
          {/* Main Blue Chevron Tail */}
          <path d="M0,25 L180,25 L215,45 L180,65 L0,65 L35,45 Z" fill="#1e40af" opacity="0.6" />
          {/* Yellow Chevron */}
          <path d="M200,25 L230,25 L265,45 L230,65 L200,65 L235,45 Z" fill="#facc15" opacity="0.9" />
          {/* Red Chevron */}
          <path d="M245,30 L270,30 L295,45 L270,60 L245,60 L270,45 Z" fill="#ef4444" opacity="0.95" />
        </svg>
      </div>
    </div>
  )
}

/* ================================================================
   LOGIN PAGE
   ================================================================ */
export default function LoginPage() {
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [imgError, setImgError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (SHOWCASE_SLIDES.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveSlide((p) => (p + 1) % SHOWCASE_SLIDES.length)
      }, 5000)
    }
  }, [])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  useEffect(() => { setImgError(false) }, [activeSlide])

  const nextSlide = () => { setActiveSlide((p) => (p + 1) % SHOWCASE_SLIDES.length); resetTimer() }
  const prevSlide = () => { setActiveSlide((p) => (p - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length); resetTimer() }
  const dotClick = (i: number) => { setActiveSlide(i); resetTimer() }

  const slide = SHOWCASE_SLIDES.length > 0 ? SHOWCASE_SLIDES[activeSlide] : null

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-blue-50/50"
    >
      {/* ── Centered Enterprise Workspace Container ── */}
      <div
        className="w-full max-w-[1440px] flex flex-col lg:flex-row overflow-hidden relative bg-white"
        style={{
          height: '820px',
          maxHeight: '92vh',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 40, 110, 0.15), 0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* ════════════════════════════════════════════════════
            LEFT PANEL — Authentication Form (50%)
            ════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[50%] bg-white flex flex-col items-center py-12 sm:py-14 px-8 sm:px-14 relative z-10 overflow-y-auto">
          
          <div className="w-full max-w-[460px] flex flex-col h-full relative">
            
            {/* Top Left Back Button (Absolute to Container) */}
            <div className="absolute -top-4 -left-6 sm:-left-12">
              <button
                type="button"
                className="w-[38px] h-[38px] rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Zone A: Top Header — Institutional Branding */}
            <div className="flex items-center gap-4 shrink-0 mt-2">
              <img src={logo} alt="PSA Seal" className="h-[64px] w-[64px] object-contain shrink-0" />
              <div className="min-w-0 flex flex-col">
                <h1 className="text-[20px] font-bold text-slate-800 leading-tight tracking-tight whitespace-nowrap">
                  Philippine Statistics Authority
                </h1>
                <div className="flex items-center mt-1">
                  <p className="text-[11.5px] font-bold text-slate-500 tracking-[0.1em] uppercase">
                    REGION XII <span className="text-brand-600 mx-1.5">&middot;</span> INVENTORY SYSTEM
                  </p>
                </div>
                {/* PSA Tricolor Bar under subtitle */}
                <div className="flex h-[3.5px] w-[140px] mt-2.5 rounded-full overflow-hidden">
                  <div className="flex-[1.5] bg-[#1a56db]" />
                  <div className="flex-[1] bg-[#facc15]" />
                  <div className="flex-[1.5] bg-[#ef4444]" />
                </div>
              </div>
            </div>

            {/* Flexible spacer to balance layout */}
            <div className="flex-[0.8] min-h-[50px]" />

            {/* Zone B: Authentication Form Area */}
            <div className="w-full shrink-0">
              <h2 className="text-[42px] font-extrabold text-slate-900 tracking-tight leading-none mb-3">
                Sign In
              </h2>
              <p className="text-[15px] text-slate-500 mb-8 leading-relaxed max-w-[400px]">
                Secure your access to the PSA Region XII Inventory Management System.
              </p>

              <LoginForm onPrivacyClick={() => setShowPrivacy(true)} />
            </div>

            {/* Flexible spacer to balance layout */}
            <div className="flex-[1.2] min-h-[40px]" />

            {/* Zone C: Security Footer Information */}
            <div className="flex items-center justify-between pt-6 mt-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-brand-700 shrink-0">
                  <ShieldCheck size={18} className="stroke-[2.2]" />
                </div>
                <div className="text-[11.5px] leading-tight">
                  <p className="font-bold text-slate-700">This is a secure and private system.</p>
                  <p className="text-slate-400 mt-0.5">Philippine Statistics Authority &middot; Region XII</p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2.5 text-[12.5px] font-bold text-slate-600 cursor-default select-none pr-1">
                <span className="w-5 h-3.5 bg-red-600 rounded-[2px] inline-block relative overflow-hidden shrink-0 shadow-sm border border-slate-200">
                  <span className="absolute top-0 left-0 w-full h-1/2 bg-blue-700" />
                  <span className="absolute top-0 left-0 w-2.5 h-full bg-white [clip-path:polygon(0_0,100%_50%,0_100%)] flex items-center justify-start pl-0.5">
                    <span className="w-[3px] h-[3px] rounded-full bg-yellow-400" />
                  </span>
                </span>
                <span>ENG</span>
                <ChevronDown size={14} className="text-slate-400 stroke-[2.5]" />
              </div>
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT PANEL — PSA Blue Visual Showcase (50%)
            ════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554] justify-center">
          
          {/* Seamless Diagonal Angle pushing into the blue */}
          <div
            className="absolute inset-y-0 left-0 w-40 bg-white z-[1] pointer-events-none"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            aria-hidden="true"
          />

          {/* Faint Background Geometric Shapes */}
          <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full border-[1.5px] border-white/[0.04] pointer-events-none z-0" aria-hidden="true" />
          <div className="absolute -bottom-20 left-10 w-[450px] h-[450px] rounded-full border-[1.5px] border-white/[0.03] pointer-events-none z-0" aria-hidden="true" />

          {/* Three-Arrow Background Animation */}
          <AnimatedArrows />

          {/* Main Visual Composition Container 
              We use a defined width and place it safely away from the seam */}
          <div className="relative z-10 flex flex-col h-full w-[600px] py-16 pl-14">
            
            {/* Top Spacer */}
            <div className="flex-[0.4] min-h-[20px]" />

            {/* Upper Content Row: Hero Card + Feature Stack */}
            <div className="flex items-start justify-start gap-8 w-full">
              
              {/* Hero Showcase Card */}
              <div className="w-[300px] h-[340px] bg-white rounded-[20px] shadow-2xl overflow-hidden shrink-0 flex flex-col justify-between relative z-20">
                <div className="h-[185px] w-full bg-slate-100 relative overflow-hidden shrink-0">
                  {slide && !imgError ? (
                    <img
                      key={activeSlide}
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover transition-opacity duration-500"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-[#1a56db]">
                      <Building2 size={44} className="stroke-[1.5]" />
                      <span className="text-[12px] font-bold mt-2">PSA Regional Facility</span>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white flex flex-col justify-center flex-1 items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1a56db] flex items-center justify-center mb-3">
                    <Package size={20} className="stroke-[2]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                    {slide?.title || 'Inventory Management'}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-2 px-3">
                    {slide?.description || 'Track and manage government assets efficiently.'}
                  </p>
                </div>
              </div>

              {/* Vertical Feature Badges Stack */}
              <div className="flex-1 h-[340px] py-3 shrink-0 flex flex-col justify-between">
                
                {/* Feature 1: Secure */}
                <div className="flex items-center gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-white shadow-lg flex items-center justify-center text-[#1a56db] shrink-0">
                    <ShieldCheck size={20} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-white tracking-wide leading-tight">Secure</h4>
                    <p className="text-[12px] text-blue-100/90 leading-tight mt-1.5">
                      Data protection and access control.
                    </p>
                  </div>
                </div>

                {/* Feature 2: Efficient */}
                <div className="flex items-center gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-white shadow-lg flex items-center justify-center text-[#1a56db] shrink-0">
                    <RefreshCw size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-white tracking-wide leading-tight">Efficient</h4>
                    <p className="text-[12px] text-blue-100/90 leading-tight mt-1.5">
                      Streamlined processes for better service.
                    </p>
                  </div>
                </div>

                {/* Feature 3: Transparent */}
                <div className="flex items-center gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-white shadow-lg flex items-center justify-center text-[#1a56db] shrink-0">
                    <BarChart3 size={20} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-bold text-white tracking-wide leading-tight">Transparent</h4>
                    <p className="text-[12px] text-blue-100/90 leading-tight mt-1.5">
                      Accountability through real-time reporting.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Clear spacing before Context Card */}
            <div className="h-10 shrink-0" />

            {/* Middle Row: PSA Region XII Context Card */}
            {/* Spans the width of Hero Card + Features */}
            <div className="w-[550px] bg-white rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex items-center justify-between text-slate-900 z-20">
              
              {/* PSA Tri-color Top Accent Strip (Centered) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex h-[4px] w-[100px] rounded-b-lg overflow-hidden">
                <div className="flex-[1.5] bg-[#1a56db]" />
                <div className="flex-[1] bg-[#facc15]" />
                <div className="flex-[1.5] bg-[#ef4444]" />
              </div>

              {/* Faint Wireframe Globe Watermark */}
              <div className="absolute -right-12 -bottom-16 pointer-events-none opacity-[0.03] text-brand-900" aria-hidden="true">
                <Globe size={220} strokeWidth={1} />
              </div>

              <div className="flex items-center gap-5 relative z-10">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-blue-50 flex items-center justify-center text-[#1a56db] shrink-0 shadow-sm border border-blue-100">
                  <Building2 size={26} className="stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[16px] font-bold text-slate-900 leading-tight">
                    PSA Region XII
                    <span className="block font-semibold text-slate-700 mt-1">Inventory System</span>
                  </h4>
                  <p className="text-[12.5px] text-slate-500 mt-2 leading-relaxed max-w-[320px]">
                    Supporting data-driven decisions for a stronger, more responsive Philippines.
                  </p>
                </div>
              </div>

              <div className="relative z-10 pl-4 pr-2">
                <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#1a56db] hover:bg-blue-50 transition-colors shadow-sm focus:outline-none">
                  <ArrowRight size={18} />
                </button>
              </div>

            </div>

            {/* Large controlled breathing space */}
            <div className="flex-[1.5] min-h-[40px]" />

            {/* Bottom Row: Carousel Navigation Controls */}
            {SHOWCASE_SLIDES.length > 1 && (
              <div className="relative z-10 flex items-center justify-center gap-5 shrink-0 w-[550px]">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-3">
                  {SHOWCASE_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => dotClick(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeSlide
                          ? 'w-8 h-2 bg-white'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextSlide}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* ── Mobile: Compact Branded Banner (below lg breakpoint) ── */}
        <div className="lg:hidden bg-gradient-to-r from-brand-700 to-brand-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
               <h4 className="font-bold text-[14.5px]">PSA Region XII</h4>
               <p className="text-[12px] text-blue-100/90 mt-0.5">Inventory System</p>
            </div>
          </div>
        </div>

      </div>

      {/* Privacy Modal */}
      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Notice" maxWidth={900}>
        <PrivacyNoticePage />
      </Modal>
    </main>
  )
}
