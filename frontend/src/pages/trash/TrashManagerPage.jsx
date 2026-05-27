import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, Folder, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileIcon } from '../../components/files/FileIcon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { api, getApiError } from '../../services/apiClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUiStore } from '../../store/uiStore.js';
import { getDriveCategory } from '../../utils/fileCategories.js';
import { formatBytes, formatDate } from '../../utils/formatters.js';

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function TrashManagerPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?._id || state.user?.id || null);
  const setPreview = useUiStore((state) => state.setPreview);

  const trashQuery = useQuery({
    queryKey: ['trash-items', userId, accessToken],
    queryFn: async () => {
      const [filesResponse, foldersResponse] = await Promise.all([
        api.get('/files', { params: { trash: true, folder: 'all', sort: '-trashedAt', _t: Date.now() } }),
        api.get('/folders', { params: { trash: true, _t: Date.now() } })
      ]);
      return {
        files: filesResponse.data.files || [],
        folders: foldersResponse.data.folders || []
      };
    },
    enabled: Boolean(accessToken),
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const action = useMutation({
    mutationFn: async ({ path, method = 'post' }) => api({ url: path, method }),
    onSuccess: (_data, variables) => {
      toast.success(variables.message);
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getApiError(error))
  });

  const files = trashQuery.data?.files || [];
  const folders = trashQuery.data?.folders || [];
  const rows = [
    ...folders.map((folder) => ({ ...folder, kind: 'folder' })),
    ...files.map((file) => ({ ...file, kind: 'file' }))
  ].sort((a, b) => new Date(b.trashedAt || b.updatedAt) - new Date(a.trashedAt || a.updatedAt));

  function restore(item) {
    action.mutate({
      path: `/${item.kind === 'folder' ? 'folders' : 'files'}/${item._id}/restore`,
      message: `${item.kind === 'folder' ? 'Folder' : 'File'} restored`
    });
  }

  function deletePermanent(item) {
    if (!window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) return;
    action.mutate({
      path: `/${item.kind === 'folder' ? 'folders' : 'files'}/${item._id}`,
      method: 'delete',
      message: `${item.kind === 'folder' ? 'Folder' : 'File'} permanently deleted`
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 pb-10">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#4fdbc8]/10 bg-[#4fdbc8]/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#4fdbc8]/70">Trash</span>
          <h1 className="font-display mb-2 text-3xl font-medium text-white/90">Deleted items</h1>
          <p className="max-w-xl text-sm leading-6 text-[#bbcac6]/55">Deleted files and folders stay here for 30 days before permanent cleanup. Restore anything you still need.</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-4 py-3 text-xs text-[#bbcac6]/60">
          {rows.length} item{rows.length === 1 ? '' : 's'} in trash
        </div>
      </header>

      <motion.div
        className="flex items-start gap-3 rounded-xl border border-[#4fdbc8]/15 bg-[#4fdbc8]/[0.07] p-3 shadow-[0_14px_42px_rgba(0,0,0,.14)] backdrop-blur-xl"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 text-[#4fdbc8]"><AlertCircle size={17} /></div>
        <div>
          <p className="text-sm font-semibold text-white/90">Deleted items stay in Trash for 30 days.</p>
          <p className="mt-0.5 text-xs leading-5 text-[#bbcac6]/60">After 30 days they are automatically deleted permanently. Restore items or delete them manually anytime.</p>
        </div>
      </motion.div>

      {trashQuery.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : rows.length ? (
        <motion.section className="overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0e1513]/30 shadow-[0_24px_90px_rgba(0,0,0,.22)] backdrop-blur-xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {rows.map((item) => (
            <TrashCard
              key={`${item.kind}-${item._id}`}
              item={item}
              onRestore={() => restore(item)}
              onDelete={() => deletePermanent(item)}
              onPreview={() => item.kind === 'file' && setPreview(item, files, files.findIndex((file) => file._id === item._id))}
              loading={action.isPending}
            />
          ))}
        </motion.section>
      ) : (
        <div className="premium-card grid min-h-80 place-items-center rounded-xl p-10 text-center">
          <div>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/[0.05] bg-white/[0.02] text-[#4fdbc8]/60"><Trash2 size={30} /></div>
            <h2 className="font-display mt-5 text-2xl font-semibold text-white/90">Trash is empty</h2>
            <p className="mt-2 text-sm text-[#bbcac6]/50">Deleted files and folders will appear here before permanent cleanup.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TrashCard({ item, onRestore, onDelete, onPreview, loading }) {
  const isFile = item.kind === 'file';
  const category = isFile ? getDriveCategory(item) : 'folder';
  const remainingDays = getRemainingDays(item.trashedAt);

  return (
    <article className="group grid gap-3 border-b border-white/[0.04] p-3 last:border-0 transition hover:bg-white/[0.025] sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
      <button className="relative h-16 w-full overflow-hidden rounded-lg border border-white/[0.03] bg-white/[0.02] sm:h-[62px] sm:w-[88px]" onClick={onPreview} disabled={!isFile}>
        {isFile && category === 'image' ? (
          <img loading="lazy" src={item.thumbnailUrl || item.secureUrl || item.url} alt={item.name} className="h-full w-full object-cover opacity-80 grayscale-[.25] transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
        ) : isFile && category === 'video' ? (
          <video preload="metadata" muted src={item.secureUrl || item.url} className="h-full w-full object-cover opacity-70 grayscale transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-white/20">{isFile ? <FileIcon category={item.fileType || item.category} /> : <Folder size={32} />}</div>
        )}
      </button>
      <div className="min-w-0">
        <h3 className="file-list-name max-h-none" title={item.name}>{item.name}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#bbcac6]/55">
          <Meta label="Type" value={isFile ? item.fileType || item.category || 'File' : 'Folder'} />
          <Meta label="Size" value={isFile ? formatBytes(item.size) : 'Folder'} />
          <Meta label="Deleted" value={formatDate(item.trashedAt || item.updatedAt)} />
          <Meta label="Cleanup" value={`${remainingDays} day${remainingDays === 1 ? '' : 's'}`} urgent={remainingDays <= 3} />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <button className="btn-secondary px-3 py-2 text-xs" onClick={onRestore} disabled={loading}><RotateCcw size={15} />Restore</button>
        <button className="btn border border-rose-300/20 bg-rose-500/15 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/25" onClick={onDelete} disabled={loading}><Trash2 size={15} />Delete</button>
      </div>
    </article>
  );
}

function Meta({ label, value, urgent = false }) {
  return (
    <span className={`rounded-md border border-white/[0.04] bg-white/[0.025] px-2 py-1 ${urgent ? 'text-rose-200' : ''}`} title={value}>
      <span className="mr-1 text-[9px] font-semibold uppercase tracking-wider text-[#bbcac6]/30">{label}</span>
      <span className="font-medium text-[#dde4e1]/75">{value}</span>
    </span>
  );
}

function getRemainingDays(trashedAt) {
  if (!trashedAt) return RETENTION_DAYS;
  const elapsed = Date.now() - new Date(trashedAt).getTime();
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed / DAY_MS));
}
