import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Image, LayoutGrid, Search, Star, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DriveItemGrid } from '../../components/files/DriveItemGrid.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { api } from '../../services/apiClient.js';
import { groupFilesByDate } from '../../utils/dateGroups.js';

const sections = [
  { key: '', label: 'All', icon: LayoutGrid },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Videos', icon: Video },
  { key: 'files', label: 'Files', icon: FileText }
];

export function StarredPage() {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('');
  const params = useMemo(() => ({ q: query, type: activeType, starred: true, trash: false, sort: '-updatedAt', folder: 'all' }), [activeType, query]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['starred-files', params],
    queryFn: async () => (await api.get('/files', { params })).data,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const grouped = useMemo(() => groupFilesByDate(data?.files || []), [data?.files]);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 pb-10">
      <section>
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/80"><Star size={12} /> Starred</span>
            <h1 className="font-display mb-2 text-3xl font-medium tracking-normal text-white/90">Starred files</h1>
            <p className="max-w-lg text-xs font-light leading-relaxed text-[#bbcac6]/50">Your marked resources stay here across refreshes and sign-ins.</p>
          </div>
          <div className="relative w-full min-w-64 max-w-md">
            <Search className="absolute left-3 top-3 text-[#4fdbc8]/70" size={18} />
            <input className="input h-11 rounded-full pl-10" placeholder="Search starred files" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <div className="premium-card flex flex-wrap gap-2 rounded-xl border-white/[0.03] bg-[#0e1513]/30 p-2">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={label}
              className={`relative flex min-w-28 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${activeType === key ? 'text-white' : 'text-[#bbcac6]/50 hover:text-white'}`}
              onClick={() => setActiveType(key)}
            >
              {activeType === key && <motion.span layoutId="starred-tab" className="absolute inset-0 rounded-lg border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 shadow-[0_0_30px_rgba(79,219,200,.13)]" />}
              <Icon className="relative z-10" size={17} />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
          </motion.div>
        ) : isError ? (
          <motion.div key="error" className="premium-card grid min-h-72 place-items-center rounded-xl p-10 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div>
              <h3 className="font-display text-2xl font-semibold">Could not load starred files</h3>
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
                <DriveItemGrid files={files} folders={[]} viewMode="grid" emptyTitle="No starred files" emptyDescription="Star files from My Drive and they will appear here." />
              </div>
            ))}
            {!Object.keys(grouped).length && (
              <DriveItemGrid files={[]} folders={[]} viewMode="grid" emptyTitle="No starred files" emptyDescription="Star files from My Drive and they will appear here." />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
