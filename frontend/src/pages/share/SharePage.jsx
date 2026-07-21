import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, FileArchive, FileText, Music } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileIcon } from '../../components/files/FileIcon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { api } from '../../services/apiClient.js';
import { getDriveCategory } from '../../utils/fileCategories.js';
import { canRenderInline } from '../../utils/filePreview.js';
import { formatBytes, formatDate } from '../../utils/formatters.js';

export function SharePage() {
  const { token } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['share', token], queryFn: async () => (await api.get(`/shares/public/${token}`)).data, retry: false });

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070b] p-6">
        <section className="w-full max-w-3xl space-y-5">
          <Skeleton className="h-[44vh] w-full" />
          <Skeleton className="mx-auto h-8 w-2/3" />
          <Skeleton className="mx-auto h-20 w-full max-w-lg" />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070b] p-6">
        <div className="premium-card max-w-md p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-rose-400/10 text-rose-100"><FileText size={26} /></div>
          <h1 className="mt-4 text-xl font-semibold">This share link is unavailable.</h1>
          <p className="mt-2 text-sm text-slate-500">It may have expired, been removed, or the file may no longer be shared.</p>
        </div>
      </main>
    );
  }

  const link = data?.link;
  const file = link?.file;
  const folder = link?.folder;
  const title = file?.name || folder?.name || 'Shared item';
  const fileUrl = file?.secureUrl || file?.url;

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070b] p-4 sm:p-6">
      <section className="premium-card w-full max-w-4xl p-4 text-center sm:p-6">
        {!file && !folder ? (
          <div className="grid min-h-72 place-items-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100"><FileText size={30} /></div>
              <h1 className="mt-5 text-2xl font-bold">Nothing to preview</h1>
              <p className="mt-2 text-sm text-slate-500">The shared item is no longer available.</p>
            </div>
          </div>
        ) : (
          <>
            <SharePreview file={file} />
            <h1 className="mt-5 break-words text-2xl font-bold text-white">{title}</h1>
            {file && <p className="mt-2 text-sm text-slate-500">{formatBytes(file.size || 0)} - {file.mimeType || file.fileType || 'File'}</p>}
            <div className="mx-auto mt-5 grid max-w-2xl gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-4 text-left text-sm text-slate-400 sm:grid-cols-2">
              <Metadata label="Owner" value={link?.owner?.name || link?.owner?.email || 'CloudNest user'} />
              <Metadata label="Uploaded" value={file?.createdAt ? formatDate(file.createdAt) : 'Unavailable'} />
              <Metadata label="Views" value={`${link?.views || 0}`} />
              <Metadata label="Type" value={file?.fileType || file?.category || file?.extension || 'File'} />
            </div>
            {file && fileUrl && link?.downloadEnabled && (
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <a className="btn-primary" href={fileUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Open file</a>
                <a className="btn-secondary" href={fileUrl} target="_blank" rel="noreferrer" download={file.name}><Download size={18} /> Download</a>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Metadata({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-300">{value}</p>
    </div>
  );
}

function SharePreview({ file }) {
  const [mediaError, setMediaError] = useState(false);

  if (!file) return <PreviewIcon category="document" />;

  const src = file.secureUrl || file.url;
  const category = getDriveCategory(file);
  if (!src || mediaError) return <PreviewIcon category={iconCategory(file)} />;

  if (category === 'image') {
    return <img className="mx-auto max-h-[56vh] w-full max-w-3xl rounded-lg border border-white/10 object-contain" src={src} alt={file.name} onError={() => setMediaError(true)} />;
  }
  if (category === 'video') {
    return <video className="mx-auto max-h-[56vh] w-full max-w-3xl rounded-lg border border-white/10 bg-black" controls src={src} onError={() => setMediaError(true)} />;
  }
  if (String(file.mimeType || '').startsWith('audio/')) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100"><Music size={30} /></div>
        <audio className="w-full" controls src={src} onError={() => setMediaError(true)} />
      </div>
    );
  }
  if (canRenderInline(file)) {
    return <iframe className="mx-auto h-[56vh] w-full max-w-3xl rounded-lg border border-white/10 bg-white" title={file.name} src={src} onError={() => setMediaError(true)} />;
  }

  return <PreviewIcon category={iconCategory(file)} />;
}

function PreviewIcon({ category }) {
  const Icon = category === 'archive' ? FileArchive : null;
  return (
    <div className="mx-auto grid min-h-72 w-full max-w-3xl place-items-center rounded-lg border border-white/10 bg-white/[0.025]">
      <div className="grid h-20 w-20 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100">
        {Icon ? <Icon size={34} /> : <FileIcon category={category} className="text-cyan-100" />}
      </div>
    </div>
  );
}

function iconCategory(file) {
  const extension = String(file.extension || '').toLowerCase();
  const mimeType = String(file.mimeType || '').toLowerCase();
  if (mimeType.startsWith('audio/')) return 'audio';
  if (extension.includes('zip') || mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
  if (file.fileType) return file.fileType;
  return getDriveCategory(file);
}
