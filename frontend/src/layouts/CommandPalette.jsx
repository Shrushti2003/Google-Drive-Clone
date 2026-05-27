import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { FileSearch, FolderPlus, Sparkles, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api, getApiError } from '../services/apiClient.js';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans.js';
import { useUiStore } from '../store/uiStore.js';
import { formatBytes } from '../utils/formatters.js';

const commands = [
  { key: 'upload', title: 'Upload files', detail: 'Open the magnetic upload surface', icon: UploadCloud },
  { key: 'folder', title: 'Create folder', detail: 'Structure a new workspace collection', icon: FolderPlus },
  { key: 'search', title: 'Search media', detail: 'Find photos, videos, PDFs, and audio', icon: FileSearch },
  { key: 'storage', title: 'Storage insight', detail: 'Review usage and plan limits', icon: Sparkles }
];

export function CommandPalette() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const setDriveSearch = useUiStore((state) => state.setDriveSearch);
  const setDriveSection = useUiStore((state) => state.setDriveSection);
  const currentFolderId = useUiStore((state) => state.currentFolderId);
  const [activeDialog, setActiveDialog] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const uploadInputRef = useRef(null);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
    enabled: open && activeDialog === 'storage'
  });

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await api.get('/billing/subscription')).data,
    enabled: open && activeDialog === 'storage'
  });

  const createFolder = useMutation({
    mutationFn: async () => (await api.post('/folders', {
      name: folderName.trim(),
      parent: currentFolderId === 'all' ? null : currentFolderId
    })).data,
    onSuccess: () => {
      toast.success('Folder created');
      setFolderName('');
      setActiveDialog(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      navigate('/app');
    },
    onError: (error) => toast.error(getApiError(error))
  });

  const uploadFiles = useMutation({
    mutationFn: async (files) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      return (await api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: (data) => {
      toast.success(`${data.files.length} file${data.files.length === 1 ? '' : 's'} uploaded`);
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/app');
    },
    onError: (error) => toast.error(getApiError(error))
  });

  function runCommand(key) {
    if (key === 'upload') {
      setDriveSection('');
      navigate('/app');
      uploadInputRef.current?.click();
      setOpen(false);
      return;
    }
    setActiveDialog(key);
  }

  function submitSearch(event) {
    event.preventDefault();
    setDriveSection('');
    setDriveSearch(searchTerm.trim());
    navigate('/app');
    setActiveDialog(null);
    setOpen(false);
  }

  function submitFolder(event) {
    event.preventDefault();
    if (!folderName.trim()) return;
    createFolder.mutate();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-start bg-black/55 px-4 pt-24 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="premium-card mx-auto w-full max-w-2xl p-3" initial={{ y: -18, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.98 }}>
            <div className="flex items-center gap-3 border-b border-white/10 p-3">
              <input
                ref={uploadInputRef}
                className="hidden"
                type="file"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length) uploadFiles.mutate(files);
                  event.target.value = '';
                }}
              />
              <Sparkles className="text-cyan-200" size={18} />
              <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Ask CloudNest or run a workspace command..." autoFocus />
              <button className="rounded-md p-1.5 text-slate-400 hover:bg-white/10" onClick={() => { setActiveDialog(null); setOpen(false); }} aria-label="Close command palette"><X size={17} /></button>
            </div>

            {!activeDialog && (
              <div className="grid gap-2 p-2">
                {commands.map(({ key, title, detail, icon: Icon }) => (
                  <button key={key} className="flex items-center gap-3 rounded-lg p-3 text-left transition hover:bg-white/[0.07]" onClick={() => runCommand(key)}>
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100"><Icon size={18} /></span>
                    <span><span className="block text-sm font-semibold">{title}</span><span className="text-xs text-slate-500">{detail}</span></span>
                  </button>
                ))}
              </div>
            )}

            {activeDialog === 'folder' && (
              <form className="p-3" onSubmit={submitFolder}>
                <h2 className="font-display text-lg font-semibold">Create folder</h2>
                <p className="mt-1 text-sm text-slate-500">Add a new top-level collection to your drive.</p>
                <input className="input mt-5" placeholder="Folder name" value={folderName} onChange={(event) => setFolderName(event.target.value)} />
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setActiveDialog(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={createFolder.isPending || !folderName.trim()}>{createFolder.isPending ? 'Creating...' : 'Create folder'}</button>
                </div>
              </form>
            )}

            {activeDialog === 'search' && (
              <form className="p-3" onSubmit={submitSearch}>
                <h2 className="font-display text-lg font-semibold">Search media</h2>
                <p className="mt-1 text-sm text-slate-500">Search by file name, MIME type, extension, or category.</p>
                <input className="input mt-5" placeholder="Try images, videos, pdf, zip, contract..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setActiveDialog(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Search drive</button>
                </div>
              </form>
            )}

            {activeDialog === 'storage' && (
              <StorageInsight
                dashboard={dashboardQuery.data}
                subscription={subscriptionQuery.data?.subscription}
                loading={dashboardQuery.isLoading || subscriptionQuery.isLoading}
                onBack={() => setActiveDialog(null)}
                onUpgrade={(plan) => {
                  setActiveDialog(null);
                  setOpen(false);
                  navigate(`/pricing?plan=${plan}`);
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StorageInsight({ dashboard, subscription, loading, onBack, onUpgrade }) {
  const storage = dashboard?.storage;
  const used = storage?.used || 0;
  const limit = storage?.limit || 1;
  const percent = storage?.percent || 0;
  const currentPlan = storage?.plan || subscription?.plan || 'starter';

  return (
    <section className="p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Storage insight</h2>
          <p className="mt-1 text-sm text-slate-500">Live usage, plan limits, and subscription upgrade controls.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
      </div>

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
      ) : (
        <>
          <div className="premium-card mt-6 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">Current plan</div>
                <div className="font-display mt-1 text-2xl font-semibold capitalize">{currentPlan}</div>
              </div>
              <div className="text-right text-sm text-slate-400">{formatBytes(used)} of {formatBytes(limit)} used</div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.55)]" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">{percent}% used</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div key={plan.key} className={`rounded-lg border p-4 ${plan.key === currentPlan ? 'border-cyan-200/30 bg-cyan-200/[0.06]' : 'border-white/10 bg-white/[0.04]'}`}>
                <h3 className="font-display font-semibold">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold">{plan.price}<span className="text-xs font-medium text-slate-500">{plan.key === 'starter' ? '' : '/month'}</span></p>
                <p className="mt-1 text-xs text-slate-500">{plan.detail}</p>
                {plan.key === 'starter' ? (
                  <button type="button" className="btn-secondary mt-4 w-full" disabled>Included</button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full"
                    disabled={plan.key === currentPlan}
                    onClick={() => onUpgrade(plan.key)}
                  >
                    {plan.key === currentPlan ? 'Current' : 'Review'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
