import { motion } from 'framer-motion';
import { Bolt, Cloud, FileImage, FileText, FileVideo, LayoutDashboard, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const icons = [FileText, FileImage, FileVideo, Sparkles, Lock, ShieldCheck, FileText, FileImage];

export function AuthLayout() {
  const location = useLocation();
  const isLogin = location.pathname.includes('login');

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-[#dde4e1]">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(79,219,200,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,219,200,.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="fixed -right-56 -top-56 h-[600px] w-[600px] rounded-full bg-[#14b8a6]/10 blur-[120px]" />
      <div className="fixed -bottom-56 -left-56 h-[600px] w-[600px] rounded-full bg-[#44e2cd]/10 blur-[120px]" />
      {isLogin && (
        <Link className="fixed right-5 top-5 z-30 flex h-11 items-center justify-center gap-2 rounded-full border border-[#4fdbc8]/20 bg-[#0e1513]/70 px-5 text-sm font-semibold text-[#4fdbc8] shadow-[0_18px_45px_rgba(0,0,0,.25)] backdrop-blur-xl transition hover:border-[#4fdbc8]/40 hover:bg-[#4fdbc8]/10" to="/">
          <LayoutDashboard size={17} />
          Back to Dashboard
        </Link>
      )}

      <div className={`relative z-10 flex min-h-screen flex-col ${isLogin ? 'md:flex-row' : 'lg:flex-row'}`}>
        <section className={`${isLogin ? 'md:w-[500px] xl:w-[600px]' : 'lg:w-[45%]'} flex w-full items-center justify-center px-6 py-12 md:px-16 lg:px-20`}>
          <Outlet />
        </section>

        <aside className={`${isLogin ? 'hidden md:flex' : 'hidden lg:flex'} relative flex-1 items-center justify-center overflow-hidden border-l border-white/5 bg-[#050816] p-10 lg:p-16`}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,.05)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30 [mask-image:radial-gradient(circle,black,transparent_80%)]" />
          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
            {isLogin ? (
              <>
                <LoginScene />
                <AuthSceneCopy
                  className="mt-8"
                  title="Cloud Storage with zero clutter and instant access."
                  text="Upload files, share folders, preview documents, and keep everything synced across devices without slowing down your workflow."
                />
                <LoginSyncCard />
              </>
            ) : (
              <>
                <RegisterScene />
                <AuthSceneCopy
                  className="mt-8"
                  title="Built for modern workflows."
                  text="Instant sync, encrypted storage, smart file organization, fast uploads, and secure sharing controls in one workspace."
                />
              </>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                ['JWT Protected', ShieldCheck],
                ['Encrypted Storage', Lock],
                ['Fast Preview Engine', Bolt]
              ].map(([label, Icon]) => (
                <div key={label} className="premium-card flex items-center gap-2 rounded-full border-white/10 px-5 py-2">
                  <Icon className="text-[#14b8a6]" size={18} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function AuthSceneCopy({ title, text, className = '' }) {
  return (
    <div className={`max-w-xl text-center ${className}`}>
      <h2 className="font-display text-4xl font-semibold leading-tight text-white">{title}</h2>
      <p className="mt-5 text-base leading-7 text-[#bbcac6]/70">{text}</p>
    </div>
  );
}

function RegisterScene() {
  return (
    <div className="relative flex h-[440px] w-full items-center justify-center [perspective:1200px]">
      <motion.div className="absolute h-60 w-44 rounded-[40px] border-2 border-[#14b8a6]/40 bg-[#14b8a6]/10 shadow-[0_0_40px_rgba(20,184,166,.3),inset_0_0_20px_rgba(20,184,166,.2)] backdrop-blur-md" animate={{ scale: [1, 1.05, 1], rotateY: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,.4)_0%,transparent_70%)] blur-[15px]" />
        <Cloud className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#14b8a6]/50" size={72} fill="currentColor" />
      </motion.div>
      {icons.map((Icon, index) => {
        const angle = (index / icons.length) * Math.PI * 2;
        return (
          <motion.div
            key={index}
            className="absolute grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/[0.05] shadow-lg backdrop-blur"
            animate={{ x: Math.cos(angle) * 240, y: Math.sin(angle) * 120, rotate: 360 }}
            transition={{ duration: 15 + index, repeat: Infinity, ease: 'linear' }}
          >
            <Icon className="text-[#14b8a6]/80" size={20} />
          </motion.div>
        );
      })}
    </div>
  );
}

function LoginScene() {
  return (
    <div className="relative flex h-[300px] w-full items-center justify-center">
      <motion.div className="absolute h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(79,219,200,.32)_0%,transparent_70%)]" animate={{ scale: [1, 1.18, 1], opacity: [.45, .9, .45] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="relative z-10 flex flex-col items-center" animate={{ x: [0, 8, 0], y: [0, -6, 0] }} transition={{ duration: 7, repeat: Infinity }}>
        <Cloud className="text-[#4fdbc8]" size={104} fill="currentColor" />
      </motion.div>
      {Array.from({ length: 18 }, (_, index) => (
        <motion.div
          key={index}
          className="absolute grid h-10 w-10 place-items-center rounded border border-[#4fdbc8]/30 bg-[#4fdbc8]/10 backdrop-blur"
          initial={{ x: (Math.random() - 0.5) * 620, y: (Math.random() - 0.5) * 260, opacity: 0 }}
          animate={{ y: [100, -100], opacity: [0, .6, 0] }}
          transition={{ duration: 15 + Math.random() * 10, delay: -Math.random() * 12, repeat: Infinity, ease: 'linear' }}
        >
          {index % 5 === 0 && <FileText className="text-[#4fdbc8]/60" size={15} />}
        </motion.div>
      ))}
    </div>
  );
}

function LoginSyncCard() {
  return (
    <div className="mt-8 w-full max-w-lg rounded-xl border border-[#4fdbc8]/20 bg-[#111827]/80 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded bg-[#1a211f] text-[#4fdbc8]"><FileVideo size={18} /></div><div><div className="text-sm font-bold">Syncing now</div><div className="text-xs text-[#94a3b8]">workspace-backup.zip</div></div></div>
        <span className="text-sm font-bold text-[#4fdbc8]">79%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1a211f]"><div className="h-full w-[79%] rounded-full bg-[#4fdbc8] shadow-[0_0_10px_rgba(79,219,200,.5)]" /></div>
    </div>
  );
}
