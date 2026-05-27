import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Image, LayoutGrid, Search, UploadCloud, Video } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { DriveItemGrid } from '../../components/files/DriveItemGrid.jsx';
import { UploadDropzone } from '../../components/files/UploadDropzone.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { api } from '../../services/apiClient.js';
import { groupFilesByDate } from '../../utils/dateGroups.js';
import { matchesDriveSection } from '../../utils/fileCategories.js';
import { useUiStore } from '../../store/uiStore.js';

const sections = [
  { key: '', label: 'All', icon: LayoutGrid },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'files', label: 'Files', icon: FileText }
];

export function DrivePage() {
  const activeType = useUiStore((state) => state.driveSection);
  const setActiveType = useUiStore((state) => state.setDriveSection);
  const query = useUiStore((state) => state.driveSearch);
  const setQuery = useUiStore((state) => state.setDriveSearch);
  const currentFolderId = useUiStore((state) => state.currentFolderId);
  const setCurrentFolderId = useUiStore((state) => state.setCurrentFolderId);
  const uploadRequestId = useUiStore((state) => state.uploadRequestId);
  const params = useMemo(() => ({ q: query, type: activeType, trash: false, sort: '-createdAt', folder: currentFolderId }), [activeType, currentFolderId, query]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['drive-files', params],
    queryFn: async () => {
      const response = await api.get('/files', { params });
      let payload = response.data;
      const files = payload.files || [];

      if (activeType && files.length === 0) {
        const fallbackParams = { q: query, type: '', trash: false, sort: '-createdAt', folder: 'all' };
        const fallback = await api.get('/files', { params: fallbackParams });
        const fallbackFiles = (fallback.data.files || []).filter((file) => matchesDriveSection(file, activeType));
        if (fallbackFiles.length) {
          payload = { ...fallback.data, files: fallbackFiles, folders: [] };
        }
        if (import.meta.env.DEV) {
          console.log('[drive-files:fallback]', {
            activeType,
            categoryEndpointCount: files.length,
            allEndpointCount: fallback.data.files?.length || 0,
            filteredCount: fallbackFiles.length,
            fallbackParams
          });
        }
      }

      if (import.meta.env.DEV) {
        console.log('[drive-files:fetched]', {
          params,
          fileCount: payload.files?.length || 0,
          files: (payload.files || []).map((file) => ({
            id: file._id,
            name: file.name,
            mimeType: file.mimeType,
            category: file.category,
            fileType: file.fileType,
            extension: file.extension,
            hasUrl: Boolean(file.secureUrl || file.url)
          })),
          response: payload
        });
      }
      return payload;
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    refetch();
  }, [activeType, refetch]);

  const grouped = useMemo(() => groupFilesByDate(data?.files || []), [data?.files]);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-9 pb-10">
      <section className="mb-2">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <span className="mb-3 inline-block rounded-full border border-[#4fdbc8]/10 bg-[#4fdbc8]/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#4fdbc8]/70">CloudNest Drive</span>
            <h1 className="font-display mb-2 text-3xl font-medium tracking-normal text-white/90">Your workspace</h1>
            <p className="max-w-lg text-xs font-light leading-relaxed text-[#bbcac6]/50">Securely store and organize your high-fidelity digital assets.</p>
          </div>
          <div className="relative w-full min-w-64 max-w-md">
            <Search className="absolute left-3 top-3 text-[#4fdbc8]/70" size={18} />
            <input className="input h-11 rounded-full pl-10" placeholder="Search your drive" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#bbcac6]/50">
          <button className="rounded-md px-2 py-1 transition hover:bg-white/[0.04] hover:text-[#4fdbc8]" onClick={() => setCurrentFolderId('all')}>My Drive</button>
          {(data?.breadcrumbs || []).map((folder) => (
            <span key={folder._id} className="flex items-center gap-2">
              <span>/</span>
              <button className="rounded-md px-2 py-1 transition hover:bg-white/[0.04] hover:text-[#4fdbc8]" onClick={() => setCurrentFolderId(folder._id)}>{folder.name}</button>
            </span>
          ))}
          {data?.currentFolder && (
            <span className="flex items-center gap-2 text-[#4fdbc8]">
              <span>/</span>
              <span className="rounded-md bg-[#4fdbc8]/10 px-2 py-1">{data.currentFolder.name}</span>
            </span>
          )}
        </nav>

        <div className="premium-card flex flex-wrap gap-2 rounded-xl border-white/[0.03] bg-[#0e1513]/30 p-2">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={label}
              className={`relative flex min-w-28 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${activeType === key ? 'text-white' : 'text-[#bbcac6]/50 hover:text-white'}`}
              onClick={() => setActiveType(key)}
            >
              {activeType === key && <motion.span layoutId="drive-tab" className="absolute inset-0 rounded-lg border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 shadow-[0_0_30px_rgba(79,219,200,.13)]" />}
              <Icon className="relative z-10" size={17} />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {activeType === '' && <UploadDropzone folder={currentFolderId === 'all' ? undefined : currentFolderId} openRequestId={uploadRequestId} />}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
          </motion.div>
        ) : isError ? (
          <motion.div key="error" className="premium-card grid min-h-72 place-items-center rounded-xl p-10 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div>
              <h3 className="font-display text-2xl font-semibold">Could not load this section</h3>
              <p className="mt-2 max-w-xl text-sm text-[#bbcac6]/50">{error?.response?.data?.message || error?.message || 'The files API returned an error.'}</p>
              <button className="btn-secondary mt-5" onClick={() => refetch()}>Retry</button>
            </div>
          </motion.div>
        ) : (
          <motion.section key={activeType || 'all'} className="space-y-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {Object.entries(grouped).map(([date, files]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-lg font-medium text-white/80">{date}</h2>
                  <div className="h-px flex-1 bg-white/[0.03]" />
                  <span className="rounded-full bg-white/[0.02] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#bbcac6]/40">{files.length} item{files.length === 1 ? '' : 's'}</span>
                </div>
                <DriveItemGrid files={files} folders={activeType ? [] : data?.folders || []} viewMode="grid" />
              </div>
            ))}
            {!Object.keys(grouped).length && (
              <div className="premium-card grid min-h-80 place-items-center rounded-xl p-10 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/[0.05] bg-white/[0.02] text-[#4fdbc8]/60"><UploadCloud size={30} /></div>
                  <h3 className="font-display mt-5 text-2xl font-semibold">No uploads yet</h3>
                  <p className="mt-2 text-sm text-[#bbcac6]/50">Drop images, videos, PDFs, ZIPs, documents, or general files to begin.</p>
                </div>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
