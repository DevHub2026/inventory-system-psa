'use client'

import { FormEvent, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'

const slides = [
  {
    eyebrow: 'Inventory Management',
    title: 'Know what you have. Plan what comes next.',
    description: 'Track and manage government assets with precision, clarity, and accountability.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IVVcDSkBb66WbHDmpP6REt5ZCd3Czb.png',
  },
  {
    eyebrow: 'PSA Region XII',
    title: 'Better data for better public service.',
    description: 'Supporting data-driven decisions for a stronger, more responsive Philippines.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01e4a2d4-1d48-4567-9776-a14abd2dbdde-YoP82TjNQc1I9P55O81DI1i5NQLefE.png',
  },
  {
    eyebrow: 'Built for teams',
    title: 'Everything organized in one place.',
    description: 'Streamline workflows and keep every government asset visible and moving forward.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IVVcDSkBb66WbHDmpP6REt5ZCd3Czb.png',
  },
]

export default function Page() {
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    window.setTimeout(() => {
      setLoading(false)
      setMessage('Demo mode: connect your organization account to continue.')
    }, 700)
  }

  const current = slides[slide]

  return (
    <main className="min-h-screen bg-[#edf5ff] p-4 text-[#102b67] sm:p-8 lg:p-12">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1420px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(29,78,153,0.14)] sm:min-h-[calc(100vh-4rem)] lg:min-h-[720px]">
        <div className="flex w-full flex-col justify-between px-6 py-7 sm:px-12 sm:py-10 lg:w-[52%] lg:px-16 lg:py-12 xl:px-24">
          <header className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-[#164aa6] bg-white shadow-sm">
              <div className="relative flex size-9 items-center justify-center rounded-full border-4 border-[#164aa6] text-[10px] font-black text-[#164aa6]">
                PSA
                <span className="absolute -right-2 top-0 size-2.5 rounded-full bg-[#f5c400]" />
                <span className="absolute -bottom-1 left-1 size-2.5 rounded-full bg-[#e62d3f]" />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold leading-tight tracking-[-0.03em] sm:text-xl">Philippine Statistics Authority</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#164aa6]">Region XII · Inventory System</p>
              <div className="mt-2 flex h-1 w-32 overflow-hidden rounded-full"><span className="w-1/3 bg-[#164aa6]" /><span className="w-1/3 bg-[#f5c400]" /><span className="w-1/3 bg-[#e62d3f]" /></div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[500px] py-12 lg:py-6">
            <div className="mb-8">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2670db]"><Sparkles className="size-4" /> Welcome back</p>
              <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-[#102b67] sm:text-5xl">Sign in</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#6d85ad]">Secure your access to the PSA Region XII Inventory Management System.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="relative block">
                <span className="sr-only">Employee Number or Email</span>
                <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#5a82c1]" />
                <input required type="text" placeholder="Employee Number or Email" className="h-14 w-full rounded-xl border border-[#c9dcf8] bg-[#fbfdff] pl-12 pr-4 text-sm text-[#102b67] outline-none transition placeholder:text-[#88a4ce] focus:border-[#2670db] focus:ring-4 focus:ring-[#2670db]/10" />
              </label>
              <label className="relative block">
                <span className="sr-only">Password</span>
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#5a82c1]" />
                <input required minLength={4} type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-14 w-full rounded-xl border border-[#c9dcf8] bg-[#fbfdff] pl-12 pr-12 text-sm text-[#102b67] outline-none transition placeholder:text-[#88a4ce] focus:border-[#2670db] focus:ring-4 focus:ring-[#2670db]/10" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a82c1] transition hover:text-[#164aa6]">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
              </label>
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-[#6d85ad]"><button type="button" role="checkbox" aria-checked={remember} onClick={() => setRemember(!remember)} className={`flex size-5 items-center justify-center rounded border ${remember ? 'border-[#2670db] bg-[#2670db] text-white' : 'border-[#9ebce6] bg-white'}`}>{remember && <Check className="size-3.5" />}</button>Remember me</label>
                <button type="button" onClick={() => setMessage('Password reset instructions will be sent by your administrator.')} className="font-semibold text-[#1260d4] hover:underline">Forgot Password?</button>
              </div>
              <button disabled={loading} className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#1260d4] text-sm font-bold text-white shadow-[0_10px_22px_rgba(18,96,212,0.22)] transition hover:bg-[#0e4eaf] disabled:cursor-wait disabled:opacity-70" type="submit">{loading ? 'Checking access…' : 'Sign In'} <ArrowRight className="size-5" /></button>
              <div aria-live="polite" className="min-h-5 text-center text-xs font-medium text-[#2670db]">{message}</div>
            </form>
          </div>

          <footer className="flex items-end justify-between gap-4 border-t border-[#e4eefb] pt-5 text-[11px] text-[#7891b5]">
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 text-[#1260d4]" /><p>This is a secure and private system.<br /><strong className="text-[#164aa6]">Philippine Statistics Authority · Region XII</strong></p></div>
            <button className="font-bold text-[#164aa6]">ENG <span className="ml-1 text-[#f5c400]">▾</span></button>
          </footer>
        </div>

        <aside className="relative hidden w-[48%] overflow-hidden bg-[#1260d4] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="pointer-events-none absolute -right-24 bottom-[-90px] size-[380px] rounded-full border-[42px] border-white/10" />
          <div className="relative flex items-center justify-between text-white/70"><p className="text-xs font-bold uppercase tracking-[0.24em]">Digital public service</p><div className="flex gap-2"><span className="size-2 rounded-full bg-white" /><span className="size-2 rounded-full bg-[#f5c400]" /><span className="size-2 rounded-full bg-[#e62d3f]" /></div></div>
          <div className="relative grid gap-7 xl:grid-cols-[1fr_0.8fr] xl:items-center">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl"><img src={current.image} alt="PSA Region XII inventory system" className="h-40 w-full object-cover object-center" /><div className="p-6"><Building2 className="size-7 text-[#1260d4]" /><p className="mt-4 text-xl font-extrabold tracking-tight text-[#102b67]">{current.eyebrow}</p><p className="mt-2 text-sm leading-5 text-[#6d85ad]">{current.description}</p></div></div>
            <div className="space-y-6 text-white"><Feature icon={<ShieldCheck />} title="Secure" text="Protected access and controlled data." /><Feature icon={<KeyRound />} title="Efficient" text="Streamlined workflows for better service." /><Feature icon={<BarChart3 />} title="Transparent" text="Accountability through real-time reporting." /></div>
          </div>
          <div className="relative flex items-center justify-between"><button aria-label="Previous slide" onClick={() => setSlide((slide + slides.length - 1) % slides.length)} className="flex size-11 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/10"><ArrowLeft className="size-5" /></button><div className="flex items-center gap-2">{slides.map((_, index) => <button key={index} aria-label={`Go to slide ${index + 1}`} onClick={() => setSlide(index)} className={`h-2 rounded-full transition-all ${index === slide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />)}</div><button aria-label="Next slide" onClick={() => setSlide((slide + 1) % slides.length)} className="flex size-11 items-center justify-center rounded-full bg-white text-[#1260d4] transition hover:bg-[#f5c400]"><ArrowRight className="size-5" /></button></div>
        </aside>
      </section>
    </main>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1260d4]">{icon}</div><div><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-5 text-white/70">{text}</p></div></div>
}
