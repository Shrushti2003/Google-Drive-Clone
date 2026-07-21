import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Cloud, CreditCard, FileImage, FileText, FolderOpen, HelpCircle, Home, LogOut, Search, Settings, Star, Trash2, UploadCloud, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FilePreviewModal } from '../components/preview/FilePreviewModal.jsx';
import { api } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiStore } from '../store/uiStore.js';
import { CommandPalette } from './CommandPalette.jsx';

const navItems = [
  { key: '', label: 'All Files', tooltip: 'Folders', icon: FolderOpen },
  { key: 'image', label: 'Images', tooltip: 'Images', icon: FileImage },
  { key: 'video', label: 'Videos', tooltip: 'Videos', icon: Video },
  { key: 'files', label: 'Documents', tooltip: 'Documents', icon: FileText }
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const driveSearch = useUiStore((state) => state.driveSearch);
  const setDriveSearch = useUiStore((state) => state.setDriveSearch);
  const driveSection = useUiStore((state) => state.driveSection);
  const setDriveSection = useUiStore((state) => state.setDriveSection);
  const requestUpload = useUiStore((state) => state.requestUpload);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const settingsRef = useRef(null);
  const contentRef = useRef(null);

  function scrollContentToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.scrollingElement?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
    contentRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
  }

  useEffect(() => {
    function onClick(event) {
      if (!settingsRef.current?.contains(event.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollContentToTop();
    });
  }, [location.pathname]);

  const deleteAccount = useMutation({
    mutationFn: async () => api.delete('/auth/me'),
    onSuccess: () => {
      clearSession();
      toast.success('Account deleted');
      navigate('/', { replace: true });
    },
    onError: () => toast.error('Account could not be deleted right now')
  });

  async function logout() {
    await api.post('/auth/logout').catch(() => null);
    clearSession();
    toast.success('Signed out');
    navigate('/');
  }

  function goToSection(section) {
    setDriveSection(section);
    if (location.pathname !== '/app') navigate('/app');
  }

  function goToAppRoute(path) {
    setSettingsOpen(false);
    navigate(path);
    requestAnimationFrame(scrollContentToTop);
    setTimeout(scrollContentToTop, 80);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0e1513] text-[#dde4e1]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,#0f1a18_0%,#0e1513_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50">
        {Array.from({ length: 15 }, (_, index) => <span key={index} className="geometric-wire" style={{ left: `${(index * 73) % 100}%`, top: `${(index * 41) % 100}%`, animationDelay: `${index * -0.7}s` }} />)}
      </div>

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-56 flex-col border-r border-white/[0.03] bg-[#0e1513]/30 backdrop-blur-2xl md:flex">
        <div className="flex flex-col gap-2 p-6">
          <Link to="/" className="tooltip-button flex items-center gap-2.5" data-tooltip="Home" data-tooltip-align="left">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 text-[#4fdbc8] shadow-[0_0_10px_rgba(20,184,166,.15)]"><Cloud size={18} /></div>
            <div><h1 className="font-display text-base font-semibold leading-none tracking-tight text-white">CloudNest</h1><p className="mt-1 text-[9px] font-medium uppercase tracking-[0.15em] text-[#bbcac6]/40">Workspace</p></div>
          </Link>
        </div>
        <nav className="mt-2 flex-1 px-3">
          <div className="flex flex-col gap-0.5">
            {navItems.map(({ key, label, tooltip, icon: Icon }) => (
              <button key={label} className={`tooltip-button flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition ${driveSection === key && location.pathname === '/app' ? 'border-r border-[#4fdbc8] bg-[#4fdbc8]/5 text-[#4fdbc8]' : 'text-[#bbcac6]/60 hover:bg-white/[0.03] hover:text-white'}`} data-tooltip={tooltip} onClick={() => goToSection(key)}>
                <Icon size={18} />{label}
              </button>
            ))}
          </div>
        </nav>
        <div className="mt-auto p-5">
          <div className="glass-panel mb-5 flex flex-col gap-3 rounded-lg p-4">
            <div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-widest text-[#bbcac6]/50">Storage</span><span className="text-[10px] font-semibold text-[#4fdbc8]/80">82%</span></div>
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5"><div className="h-full w-[82%] bg-[#4fdbc8]/60" /></div>
            <Link className="rounded-md border border-white/[0.05] bg-white/[0.05] py-2 text-center text-[10px] font-semibold text-white/80 transition hover:bg-[#4fdbc8] hover:text-[#0e1513]" to="/pricing">Upgrade</Link>
          </div>
          <div className="flex flex-col gap-0.5 border-t border-white/[0.03] pt-4">
            <button className="tooltip-button flex items-center gap-2.5 px-1 py-1.5 text-left text-[11px] text-[#bbcac6]/40 transition hover:text-[#4fdbc8]" data-tooltip="Trash" data-tooltip-align="left" type="button" onClick={() => goToAppRoute('/app/trash')}><Trash2 size={16} />Trash</button>
            <button className="tooltip-button flex items-center gap-2.5 px-1 py-1.5 text-left text-[11px] text-[#bbcac6]/40 transition hover:text-[#4fdbc8]" data-tooltip="Help" data-tooltip-align="left" type="button" onClick={() => goToAppRoute('/app/help')}><HelpCircle size={16} />Help</button>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-col md:ml-56">
        <header className="sticky top-0 z-40 flex h-auto flex-col gap-3 border-b border-white/[0.02] bg-[#0e1513]/25 px-4 py-3 backdrop-blur-md md:h-16 md:flex-row md:items-center md:px-10">
          <div className="flex items-center justify-between md:hidden">
            <Link to="/" className="tooltip-button flex items-center gap-2 font-display font-semibold text-white" data-tooltip="Home" data-tooltip-align="left"><Cloud className="text-[#4fdbc8]" size={20} />CloudNest</Link>
            <button className="tooltip-button btn-secondary px-3" data-tooltip="Sign Out" data-tooltip-align="right" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button>
          </div>
          <div className="relative flex-1 md:max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbcac6]/30" size={18} />
            <input
              className="input h-10 rounded-full border-white/[0.03] bg-white/[0.03] pl-10 pr-4 text-xs placeholder:text-[#bbcac6]/30"
              placeholder="Search resources..."
              value={driveSearch}
              onChange={(event) => {
                setDriveSearch(event.target.value);
                if (location.pathname !== '/app') navigate('/app');
              }}
            />
            <kbd className="absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/[0.05] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] text-[#bbcac6]/30 md:block">Ctrl K</kbd>
          </div>
          <div className="flex items-center justify-between gap-3 md:ml-auto md:justify-end">
            <div className="flex items-center gap-0.5">
              <button className="tooltip-button p-1.5 text-[#bbcac6]/40 transition hover:text-[#4fdbc8]" data-tooltip="Upload" onClick={requestUpload} aria-label="Upload files"><UploadCloud size={20} /></button>
              <Link className={`tooltip-button p-1.5 transition hover:text-[#4fdbc8] ${location.pathname === '/app/starred' ? 'text-amber-300' : 'text-[#bbcac6]/40'}`} data-tooltip="Starred" to="/app/starred" aria-label="Starred files"><Star size={20} /></Link>
              <Link className="tooltip-button p-1.5 text-[#bbcac6]/40 transition hover:text-[#4fdbc8]" data-tooltip="Billing" data-tooltip-align="right" to="/pricing" aria-label="Billing"><CreditCard size={20} /></Link>
              <div className="relative" ref={settingsRef}>
                <button className="tooltip-button p-1.5 text-[#bbcac6]/40 transition hover:text-[#4fdbc8]" data-tooltip="Settings" data-tooltip-align="right" aria-label="Settings" onClick={() => setSettingsOpen((open) => !open)}><Settings size={20} /></button>
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0e1513]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }}>
                      <SettingsItem icon={HelpCircle} label="Help" onClick={() => goToAppRoute('/app/help')} />
                      <SettingsItem icon={Trash2} label="Trash" onClick={() => goToAppRoute('/app/trash')} />
                      <SettingsItem icon={Home} label="Back to Home Page" onClick={() => { setSettingsOpen(false); navigate('/'); }} />
                      <div className="my-1 h-px bg-white/[0.06]" />
                      <SettingsItem danger icon={Trash2} label="Delete Account" onClick={() => { setSettingsOpen(false); setConfirmDeleteOpen(true); }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="hidden h-4 w-px bg-white/[0.05] sm:block" />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="text-right"><p className="text-xs font-medium leading-none text-white/90">{user?.name || 'CloudNest User'}</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#bbcac6]/30">{user?.plan || 'Starter'}</p></div>
              <div className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.05] bg-[#4fdbc8]/10 text-xs font-bold text-[#4fdbc8]">{(user?.name || 'C').slice(0, 1).toUpperCase()}</div>
            </div>
            <button className="tooltip-button hidden p-1.5 text-[#bbcac6]/40 transition hover:text-[#4fdbc8] md:block" data-tooltip="Sign Out" data-tooltip-align="right" onClick={logout} aria-label="Sign out"><LogOut size={20} /></button>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 py-8 md:px-10"
        >
          <Outlet />
        </motion.main>
      </div>
      <CommandPalette />
      <FilePreviewModal />
      <DeleteAccountDialog open={confirmDeleteOpen} loading={deleteAccount.isPending} onClose={() => setConfirmDeleteOpen(false)} onConfirm={() => deleteAccount.mutate()} />
    </div>
  );
}

function SettingsItem({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button type="button" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${danger ? 'text-rose-300 hover:bg-rose-400/10' : 'text-[#dde4e1]/80 hover:bg-white/[0.05] hover:text-[#4fdbc8]'}`} onClick={onClick}>
      <Icon size={17} />{label}
    </button>
  );
}

function DeleteAccountDialog({ open, loading, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-xl">
      <motion.section className="w-full max-w-md rounded-2xl border border-rose-300/20 bg-[#0e1513] p-6 shadow-[0_24px_100px_rgba(0,0,0,.55)]" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Delete account permanently?</h2>
            <p className="mt-3 text-sm leading-6 text-[#bbcac6]/70">This will delete your CloudNest account, files, folders, shared links, and saved session. This action cannot be undone.</p>
          </div>
          <button className="rounded-lg p-1.5 text-[#bbcac6]/50 transition hover:bg-white/[0.05] hover:text-white" onClick={onClose} aria-label="Close delete account dialog"><X size={18} /></button>
        </div>
        <div className="mt-6 rounded-xl border border-rose-300/10 bg-rose-400/5 p-4 text-sm text-rose-100/80">To prevent accidental deletion, confirm only when you are ready to remove all account data.</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn border border-rose-300/20 bg-rose-500 text-white hover:bg-rose-400" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting...' : 'Delete Account'}</button>
        </div>
      </motion.section>
    </div>
  );
}
