import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { formatBytes } from '../../utils/formatters.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

export function SharePage() {
  const { token } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['share', token], queryFn: async () => (await api.get(`/shares/public/${token}`)).data, retry: false });

  if (isLoading) return <main className="grid min-h-screen place-items-center bg-[#05070b] p-6"><Skeleton className="h-72 w-full max-w-xl" /></main>;
  if (error) return <main className="grid min-h-screen place-items-center bg-[#05070b] p-6"><div className="premium-card max-w-md p-6 text-center">This share link is unavailable.</div></main>;

  const file = data.link.file;
  return (
    <main className="grid min-h-screen place-items-center bg-[#05070b] p-6">
      <section className="premium-card w-full max-w-xl p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100"><FileText size={30} /></div>
        <h1 className="mt-5 text-2xl font-bold">{file?.name || data.link.folder?.name}</h1>
        {file && <p className="mt-2 text-sm text-slate-500">{formatBytes(file.size)} • {file.mimeType}</p>}
        <p className="mt-4 text-sm text-slate-500">Shared by {data.link.owner?.name}. Viewed {data.link.views} times.</p>
        {file && data.link.downloadEnabled && <a className="btn-primary mt-6" href={file.secureUrl || file.url} target="_blank" rel="noreferrer"><Download size={18} /> Open file</a>}
      </section>
    </main>
  );
}
