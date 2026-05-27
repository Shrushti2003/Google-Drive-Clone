import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, Cloud, Database, Lock, Search, ShieldCheck, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../../config/subscriptionPlans.js';

const partners = ['Nexus', 'Spectra', 'Polaris', 'Vertex', 'Lumen', 'Orbital'];
const features = [
  ['Secure by Default', 'Military-grade protection for every byte you store. Privacy is built into the architecture.', ShieldCheck, 'Advanced'],
  ['Instant Sync', 'Update a file on your phone and see it on desktop before your workflow loses momentum.', Zap],
  ['Smart Search', 'Find files by name, type, or context from the same fast workspace search.', Search],
  ['Built for Speed', 'A responsive edge-ready workspace that keeps previews, uploads, and sharing quick.', BarChart3]
];

export function LandingPage() {
  const particles = useMemo(() => Array.from({ length: 56 }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 0.7}px`,
    opacity: Math.random() * 0.26 + 0.12,
    duration: `${Math.random() * 15 + 16}s`,
    delay: `${Math.random() * -20}s`
  })), []);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(event) {
      setCursor({ x: event.clientX, y: event.clientY });
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-[#e2e8f0]">
      <div
        className="pointer-events-none fixed z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,.08)_0%,rgba(45,212,191,0)_70%)]"
        style={{ left: cursor.x, top: cursor.y }}
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-[#14b8a6]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              animation: `floatParticle ${particle.duration} linear ${particle.delay} infinite`
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute -left-96 -top-96 h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,.16),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-48 top-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,.10),transparent_70%)] blur-3xl" />

      <nav className="fixed top-0 z-40 w-full border-b border-[#1f2937]/70 bg-[#050816]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-16">
          <Link to="/" className="font-display text-2xl font-bold text-[#14b8a6]">CloudNest</Link>
          <div className="hidden items-center gap-10 text-sm font-medium md:flex">
            <a className="border-b-2 border-[#14b8a6] pb-1 text-[#14b8a6]" href="#platform">Platform</a>
            <a className="text-[#94a3b8] transition hover:text-[#14b8a6]" href="#features">Features</a>
            <a className="text-[#94a3b8] transition hover:text-[#14b8a6]" href="#pricing">Pricing</a>
            <a className="text-[#94a3b8] transition hover:text-[#14b8a6]" href="#security">Security</a>
          </div>
          <Link className="rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/10 px-5 py-2 text-sm font-bold text-[#14b8a6] transition hover:bg-[#14b8a6] hover:text-white" to="/signup">Get Started Free</Link>
        </div>
      </nav>

      <section id="platform" className="relative z-10 mx-auto flex min-h-[760px] max-w-[1440px] flex-col items-center gap-16 px-6 pb-20 pt-36 md:px-16 lg:flex-row lg:pt-48">
        <motion.div className="flex flex-1 flex-col gap-6" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-normal text-[#e2e8f0] lg:text-7xl">
            Your files. <br /><span className="text-[#2dd4bf]">Synced instantly.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[#94a3b8] lg:text-xl">
            Store, manage, and share everything from one beautifully fast workspace built for modern teams, creators, and everyday workflows.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link className="btn-primary px-9 py-4 text-base" to="/signup">Get Started Free <ArrowRight size={18} /></Link>
            <Link className="btn-secondary px-9 py-4 text-base text-[#14b8a6]" to="/app">Explore Workspace</Link>
          </div>
        </motion.div>

        <motion.div className="relative flex h-[500px] flex-1 items-center justify-center" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.8 }}>
          <div className="landing-cube-wrap floating">
            <div className="landing-cube">
              {['front', 'back', 'right', 'left', 'top', 'bottom'].map((side) => (
                <div key={side} className={`landing-cube-face landing-cube-${side}`}>
                  {side === 'front' && <Cloud className="text-[#14b8a6]" size={54} fill="currentColor" />}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute h-[440px] w-[440px] animate-[spin_12s_linear_infinite] rounded-full border border-[#14b8a6]/20">
                <div className="glass-panel absolute -top-4 left-1/2 -translate-x-1/2 rounded-lg p-2"><Lock className="text-[#2dd4bf]" size={16} /></div>
              </div>
              <div className="absolute h-[340px] w-[340px] animate-[spin_18s_linear_infinite_reverse] rounded-full border border-[#2dd4bf]/10">
                <div className="glass-panel absolute -right-4 top-1/2 -translate-y-1/2 rounded-lg p-2"><Database className="text-[#14b8a6]" size={16} /></div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 overflow-hidden py-20">
        <p className="mb-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#94a3b8]">Trusted by fast-moving teams worldwide</p>
        <div className="marquee-mask flex overflow-hidden">
          <div className="animate-marquee flex whitespace-nowrap px-16">
            {[...partners, ...partners].map((name, index) => <span key={`${name}-${index}`} className="mx-12 text-3xl font-bold text-[#e2e8f0]/30">{name}</span>)}
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 md:px-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-2">
          <FeatureCard feature={features[0]} className="min-h-[320px] md:col-span-2" large />
          <FeatureCard feature={features[1]} />
          <FeatureCard feature={features[2]} />
          <div className="glass-panel rounded-2xl p-8 md:col-span-2">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="font-display mb-3 text-2xl font-bold">Built for Speed</h3>
                <p className="leading-relaxed text-[#94a3b8]">Global-ready file access keeps your files milliseconds away, anywhere your work happens.</p>
              </div>
              <div className="relative h-36 overflow-hidden rounded-xl border border-[#1f2937] bg-[#0f172a]">
                <div className="absolute inset-0 flex items-end gap-3 px-4">
                  {[20, 42, 70, 92].map((height, index) => <div key={height} className="w-full rounded-t-lg bg-[#14b8a6]" style={{ height: `${height}%`, opacity: 0.25 + index * 0.22 }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DashboardPreview />
      <Pricing />

      <section className="relative z-10 px-6 py-28 md:px-16">
        <div className="glass-panel mx-auto max-w-[1200px] overflow-hidden rounded-[40px] bg-[#0f172a] p-12 text-center md:p-24">
          <h2 className="font-display mb-8 text-5xl font-bold text-[#e2e8f0] md:text-7xl">Work from anywhere.</h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[#94a3b8] md:text-xl">Join teams already using CloudNest to power secure collaboration.</p>
          <div className="flex flex-col justify-center gap-5 sm:flex-row">
            <Link className="btn-primary px-12 py-5 text-lg" to="/signup">Create Free Account</Link>
            <Link className="btn-secondary px-12 py-5 text-lg" to="/login">Book a Demo</Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ feature, className = '', large = false }) {
  const [title, body, Icon, badge] = feature;
  return (
    <motion.div className={`glass-panel rounded-2xl p-8 ${className}`} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}>
      <div className={large ? 'flex h-full flex-col justify-between' : 'flex flex-col gap-4'}>
        <div className="flex items-start justify-between gap-4">
          <div className="w-fit rounded-xl bg-[#14b8a6]/10 p-3 text-[#14b8a6]"><Icon size={large ? 36 : 24} /></div>
          {badge && <div className="rounded-full border border-[#14b8a6]/30 bg-[#050816] px-4 py-1.5 text-xs font-bold text-[#2dd4bf]">{badge}</div>}
        </div>
        <div>
          <h3 className={`font-display font-bold ${large ? 'text-2xl' : 'text-xl'}`}>{title}</h3>
          <p className={`${large ? 'mt-3' : 'mt-2 text-sm'} leading-relaxed text-[#94a3b8]`}>{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <section id="security" className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 md:px-16">
      <div className="glass-panel overflow-hidden rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1f2937] bg-[#0f172a]/70 p-6">
          <div className="flex gap-2"><span className="h-3 w-3 rounded-full bg-red-500/50" /><span className="h-3 w-3 rounded-full bg-yellow-500/50" /><span className="h-3 w-3 rounded-full bg-green-500/50" /></div>
          <div className="rounded-full border border-[#1f2937] bg-[#050816] px-6 py-1.5 text-xs text-[#94a3b8]">cloudnest.app/dashboard</div>
          <div className="w-16" />
        </div>
        <div className="grid gap-10 p-8 lg:grid-cols-3 lg:p-10">
          <div className="flex flex-col gap-6">
            <Metric title="Storage Used" value="75%" caption="1.5 TB / 2 TB" />
            <div className="glass-panel rounded-2xl bg-[#0f172a] p-6">
              <p className="mb-4 text-xs font-bold uppercase text-[#94a3b8]">Global Latency</p>
              <div className="flex items-center gap-3"><span className="text-4xl font-bold text-[#2dd4bf]">4ms</span><span className="h-4 w-1.5 rounded-full bg-[#2dd4bf]" /><span className="h-8 w-1.5 rounded-full bg-[#2dd4bf]" /><span className="h-6 w-1.5 rounded-full bg-[#2dd4bf]" /></div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl bg-[#0f172a] p-8 lg:col-span-2">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h4 className="font-display text-xl font-bold">Network Traffic</h4>
              <div className="flex items-center gap-2 text-sm font-medium text-[#14b8a6]"><span className="h-2 w-2 animate-ping rounded-full bg-[#14b8a6]" />1.2 GB/s Upload</div>
            </div>
            <svg className="h-[220px] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
              <defs><linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%"><stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" /><stop offset="100%" stopColor="#14B8A6" stopOpacity="0" /></linearGradient></defs>
              <path className="sync-stream" d="M0 80 Q 50 20 100 60 T 200 30 T 300 70 T 400 20" fill="none" stroke="#14B8A6" strokeWidth="2.5" />
              <path d="M0 80 Q 50 20 100 60 T 200 30 T 300 70 T 400 20 L 400 100 L 0 100 Z" fill="url(#chartGradient)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, caption }) {
  return (
    <div className="glass-panel rounded-2xl bg-[#0f172a] p-6">
      <p className="mb-4 text-xs font-bold uppercase text-[#94a3b8]">{title}</p>
      <div className="mb-3 flex items-end justify-between gap-4"><span className="text-4xl font-bold text-[#14b8a6]">{value}</span><span className="text-xs text-[#94a3b8]">{caption}</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#1f2937]"><div className="h-full w-3/4 rounded-full bg-[#14b8a6] shadow-[0_0_10px_#14b8a6]" /></div>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative z-10 mx-auto max-w-[1440px] px-6 py-24 md:px-16">
      <div className="mb-16 text-center">
        <h2 className="font-display mb-4 text-4xl font-bold">Simple, Transparent Pricing</h2>
        <p className="text-lg text-[#94a3b8]">No hidden fees, no limits on innovation.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan, index) => (
          <div key={plan.key} className={`glass-panel relative flex flex-col gap-8 rounded-3xl p-8 lg:p-10 ${index === 1 ? 'border-[#14b8a6]/50 shadow-2xl md:-translate-y-6' : ''}`}>
            {index === 1 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#14b8a6] px-5 py-1 text-xs font-bold uppercase tracking-wider text-white">Most Popular</div>}
            <div><h3 className="font-display text-xl font-bold">{plan.name}</h3><p className="text-sm text-[#94a3b8]">{plan.detail}</p></div>
            <div className="text-4xl font-bold">{plan.price}{plan.key !== 'starter' && <span className="text-sm font-normal text-[#94a3b8]">/mo</span>}</div>
            <ul className="flex flex-col gap-4">
              {plan.features.map((item) => <li key={item} className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-[#14b8a6]" size={18} />{item}</li>)}
            </ul>
            <Link className={index === 1 ? 'btn-primary mt-auto w-full py-4' : 'btn-secondary mt-auto w-full py-4'} to={plan.key === 'starter' ? '/signup' : `/pricing?plan=${plan.key}`}>{plan.key === 'starter' ? 'Get Started' : 'Upgrade'}</Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const groups = {
    Product: ['Platform', 'Features', 'Pricing', 'Security'],
    Resources: ['Documentation', 'API Reference', 'Blog', 'Community'],
    Company: ['About Us', 'Careers', 'Contact', 'Legal']
  };
  return (
    <footer className="relative z-10 border-t border-[#1f2937] bg-[#050816]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-12 px-6 py-20 md:grid-cols-4 md:px-16">
        <div className="col-span-2 md:col-span-1"><div className="mb-6 font-display text-2xl font-bold text-[#14b8a6]">CloudNest</div><p className="max-w-xs text-sm leading-relaxed text-[#94a3b8]">Building the future of digital infrastructure, one block at a time.</p></div>
        {Object.entries(groups).map(([title, links]) => (
          <div key={title} className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#e2e8f0]">{title}</h4>
            {links.map((link) => <a key={link} className="text-sm text-[#94a3b8] transition hover:text-[#14b8a6]" href="#platform">{link}</a>)}
          </div>
        ))}
      </div>
      <div className="border-t border-[#1f2937]/30 px-6 py-10 text-center md:px-16"><p className="text-xs text-[#94a3b8]/60">© 2026 CloudNest Systems. All rights reserved.</p></div>
    </footer>
  );
}
