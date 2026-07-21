import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Copy, Download, ExternalLink, Folder, FolderOpen, Link2, Mail, MessageCircle, MoveRight, Pencil, RotateCcw, Send, Share2, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../services/apiClient.js';
import { getDriveCategory } from '../../utils/fileCategories.js';
import { formatBytes, formatDate } from '../../utils/formatters.js';
import { useUiStore } from '../../store/uiStore.js';
import { FileIcon } from './FileIcon.jsx';

export function DriveItemGrid({ files = [], folders = [], viewMode = 'grid', trash = false, emptyTitle = 'Nothing here yet', emptyDescription = 'Upload files or create folders to start organizing this space.' }) {
  const queryClient = useQueryClient();
  const setPreview = useUiStore((state) => state.setPreview);
  const setCurrentFolderId = useUiStore((state) => state.setCurrentFolderId);
  const fileList = files.filter((file) => file.kind !== 'folder');
  const [moveTarget, setMoveTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async () => (await api.get('/folders')).data.folders,
    enabled: Boolean(moveTarget)
  });

  const action = useMutation({
    mutationFn: async ({ path, method = 'post', body }) => {
      const { data } = await api({ url: path, method, data: body });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['starred-files'] });
      queryClient.invalidateQueries({ queryKey: ['trash-items'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables?.successMessage) toast.success(variables.successMessage);
    },
    onError: (error) => toast.error(getApiError(error))
  });

  async function download(file) {
    const { data } = await api.get(`/files/${file._id}/download`);
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  function share(file) {
    setShareTarget(file);
  }

  function openItem(item) {
    if (item.kind === 'folder') {
      setCurrentFolderId(item._id);
      return;
    }
    setPreview(item, fileList, files.findIndex((file) => file._id === item._id));
  }

  const rows = [
    ...folders.map((folder) => ({ ...folder, kind: 'folder' })),
    ...files.map((file) => ({ ...file, kind: 'file' }))
  ];

  if (!rows.length) {
    return (
      <div className="premium-card grid min-h-72 place-items-center rounded-xl p-10 text-center">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#4fdbc8]/10 text-[#4fdbc8] shadow-[0_0_38px_rgba(79,219,200,.18)]">
            <Folder size={26} />
          </div>
          <h3 className="font-display mt-4 text-xl font-semibold">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-[#bbcac6]/50">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="premium-card overflow-visible rounded-xl border-white/[0.03] bg-[#0e1513]/30">
        <div className="hidden grid-cols-[minmax(0,1fr)_112px_120px_112px] border-b border-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#bbcac6]/40 sm:grid">
          <span>Name</span><span>Size</span><span>Updated</span><span />
        </div>
        {rows.map((item) => (
          <div key={`${item.kind}-${item._id}`} onDoubleClick={() => openItem(item)} className="grid w-full gap-3 border-b border-white/[0.03] px-4 py-4 text-left text-sm text-[#bbcac6] last:border-0 hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_112px_120px_112px] sm:items-center">
            <button type="button" className="flex min-w-0 items-start gap-3 text-left sm:items-center" onClick={() => openItem(item)}>
              {item.kind === 'folder' ? <Folder className="text-[#4fdbc8]" size={22} /> : <FileIcon category={item.fileType || item.category} className="text-[#bbcac6]/50" />}
              <span className="file-list-name" title={item.name}>{item.name}</span>
            </button>
            <span className="text-xs text-[#bbcac6]/45">{item.kind === 'file' ? formatBytes(item.size) : 'Folder'}</span>
            <span className="text-xs text-[#bbcac6]/45">{trash && item.trashedAt ? formatDate(item.trashedAt) : formatDate(item.updatedAt)}</span>
            <ItemActions item={item} trash={trash} action={action} download={download} share={share} onMove={setMoveTarget} onOpen={openItem} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((item) => (
        <motion.div key={`${item.kind}-${item._id}`} className="premium-card tilt-card group flex flex-col overflow-visible rounded-xl border-white/[0.03] bg-[#0e1513]/30 p-4" whileHover={{ scale: 1.012 }}>
          <div
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onDoubleClick={() => openItem(item)}
            onKeyDown={(event) => event.key === 'Enter' && openItem(item)}
          >
            <div className="relative aspect-video overflow-hidden rounded-lg border border-white/[0.02] bg-white/[0.02]">
              {item.kind === 'file' && getDriveCategory(item) === 'image' ? (
                <img loading="lazy" src={item.thumbnailUrl || item.secureUrl || item.url} alt={item.name} className="h-full w-full object-cover opacity-80 grayscale-[.25] transition duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100" />
              ) : item.kind === 'file' && getDriveCategory(item) === 'video' ? (
                <video preload="metadata" muted src={item.secureUrl || item.url} className="h-full w-full object-cover opacity-60 grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-[.2]" />
              ) : (
                <div className="grid h-full place-items-center text-white/10">
                  {item.kind === 'folder' ? <Folder size={38} /> : <FileIcon category={item.fileType || item.category} />}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
            <div className="mt-4">
              <div className="min-w-0">
                <h3 className="file-card-name" title={item.name}>{item.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-[#bbcac6]/42">
                  <span className="rounded-md border border-white/[0.04] bg-white/[0.025] px-2 py-1">{item.kind === 'file' ? formatBytes(item.size) : 'Folder'}</span>
                  <span className="rounded-md border border-white/[0.04] bg-white/[0.025] px-2 py-1">{item.kind === 'file' ? item.fileType || item.category : 'Folder'}</span>
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#bbcac6]/35">{trash && item.trashedAt ? `Deleted ${formatDate(item.trashedAt)}` : formatDate(item.updatedAt)}</p>
              </div>
              <div className="mt-3 flex items-center justify-end border-t border-white/[0.03] pt-3">
                <ItemActions item={item} trash={trash} action={action} download={download} share={share} onMove={setMoveTarget} onOpen={openItem} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      <MoveDialog item={moveTarget} folders={foldersQuery.data || []} loading={foldersQuery.isLoading} onClose={() => setMoveTarget(null)} action={action} />
      <ShareDialog item={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  );
}

function ActionButton({ label, className = 'text-[#9fb2c2] hover:bg-white/[0.06] hover:text-[#4fdbc8]', children, ...props }) {
  return (
    <button
      type="button"
      className={`tooltip-button rounded-md p-1.5 transition ${className}`}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}

function ItemActions({ item, trash, action, download, share, onMove, onOpen }) {
  if (item.kind === 'folder') {
    if (trash) {
      return (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <ActionButton label="Restore folder" onClick={() => action.mutate({ path: `/folders/${item._id}/restore`, successMessage: 'Folder restored' })}>
            <RotateCcw size={16} />
          </ActionButton>
          <ActionButton label="Permanently delete folder" className="text-rose-300 hover:bg-rose-400/10" onClick={() => {
            if (window.confirm(`Permanently delete "${item.name}" and everything inside it? This cannot be undone.`)) {
              action.mutate({ path: `/folders/${item._id}`, method: 'delete', successMessage: 'Folder permanently deleted' });
            }
          }}>
            <Trash2 size={16} />
          </ActionButton>
        </div>
      );
    }
    const renameFolder = () => {
      const name = window.prompt('Rename folder', item.name);
      if (!name || name.trim() === item.name) return;
      action.mutate({ path: `/folders/${item._id}`, method: 'patch', body: { name: name.trim() }, successMessage: 'Folder renamed' });
    };
    return (
      <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
        <ActionButton label="Open folder" onClick={() => onOpen(item)}><FolderOpen size={16} /></ActionButton>
        <ActionButton label="Rename folder" onClick={renameFolder}><Pencil size={16} /></ActionButton>
        <ActionButton label="Delete folder" className="text-rose-300 hover:bg-rose-400/10" onClick={() => action.mutate({ path: `/folders/${item._id}/trash`, successMessage: 'Folder moved to trash' })}><Trash2 size={16} /></ActionButton>
      </div>
    );
  }
  function rename() {
    const name = window.prompt('Rename file', item.name);
    if (!name || name.trim() === item.name) return;
    action.mutate({ path: `/files/${item._id}`, method: 'patch', body: { name: name.trim() }, successMessage: 'File renamed' });
  }
  return (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <ActionButton label={item.starred ? 'Unstar' : 'Star'} onClick={() => action.mutate({ path: `/files/${item._id}`, method: 'patch', body: { starred: !item.starred }, successMessage: item.starred ? 'Removed from starred' : 'Added to starred' })}>
        <Star size={16} className={item.starred ? 'fill-amber-300 text-amber-300' : 'text-slate-400'} />
      </ActionButton>
      {trash ? (
        <>
          <ActionButton label="Restore file" onClick={() => action.mutate({ path: `/files/${item._id}/restore`, successMessage: 'File restored' })}>
            <RotateCcw size={16} />
          </ActionButton>
          <ActionButton label="Permanently delete" className="text-rose-300 hover:bg-rose-400/10" onClick={() => {
            if (window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
              action.mutate({ path: `/files/${item._id}`, method: 'delete', successMessage: 'File permanently deleted' });
            }
          }}>
            <Trash2 size={16} />
          </ActionButton>
        </>
      ) : (
        <>
          <ActionButton label="Share" onClick={() => share(item)}><Link2 size={16} /></ActionButton>
          <ActionButton label="Download" onClick={() => download(item)}><Download size={16} /></ActionButton>
          <ActionButton label="Rename" onClick={rename}><Pencil size={16} /></ActionButton>
          <ActionButton label="Move" onClick={() => onMove(item)}><MoveRight size={16} /></ActionButton>
          <ActionButton label="Copy" onClick={() => action.mutate({ path: `/files/${item._id}/copy`, successMessage: 'File copied' })}><Copy size={16} /></ActionButton>
          <ActionButton label="Delete" className="text-rose-300 hover:bg-rose-400/10" onClick={() => action.mutate({ path: `/files/${item._id}/trash`, successMessage: 'Moved to trash' })}><Trash2 size={16} /></ActionButton>
        </>
      )}
    </div>
  );
}

function MoveDialog({ item, folders, loading, onClose, action }) {
  const [folder, setFolder] = useState('all');
  if (!item) return null;

  function submit(event) {
    event.preventDefault();
    action.mutate({
      path: `/files/${item._id}`,
      method: 'patch',
      body: { folder: folder === 'all' ? null : folder },
      successMessage: 'File moved'
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xl">
      <form className="premium-card w-full max-w-md p-5" onSubmit={submit}>
        <h2 className="font-display text-xl font-semibold">Move file</h2>
        <p className="mt-2 text-sm text-slate-500">Choose a destination for {item.name}.</p>
        <select className="input mt-5" value={folder} onChange={(event) => setFolder(event.target.value)} disabled={loading}>
          <option value="all">My Drive</option>
          {folders.map((target) => (
            <option key={target._id} value={target._id}>{target.name}</option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>Move</button>
        </div>
      </form>
    </div>
  );
}

function ShareDialog({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareQuery = useQuery({
    queryKey: ['share-link', item?._id],
    queryFn: async () => (await api.post('/shares', { file: item._id, visibility: 'public', downloadEnabled: true })).data,
    enabled: Boolean(item),
    refetchOnWindowFocus: false
  });

  if (!item) return null;

  const shareUrl = buildAbsoluteShareUrl(shareQuery.data?.url, shareQuery.data?.link?.token);
  const title = item.name;
  const shareText = formatShareText(item, shareUrl);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(formatShareHeadline(item));
  const encodedShareText = encodeURIComponent(shareText);
  const destinations = [
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodedShareText}` },
    { label: 'Facebook', icon: Share2, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', icon: X, href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { label: 'LinkedIn', icon: ExternalLink, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: 'Reddit', icon: Share2, href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}` },
    { label: 'Email', icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedShareText}` }
  ];

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Share message copied');
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function nativeShare() {
    if (!shareUrl || !navigator.share) {
      await copyLink();
      toast.error('Native sharing is not available. Link copied instead.');
      return;
    }

    try {
      const shareFile = await buildShareFile(item);
      if (shareFile && navigator.canShare?.({ files: [shareFile] })) {
        await navigator.share({ title, text: shareText, files: [shareFile] });
        return;
      }
      await navigator.share({ title, text: formatShareHeadline(item), url: shareUrl });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      await copyLink();
      toast.error('File sharing is not available here. Link copied instead.');
    }
  }

  async function openDiscord() {
    await copyLink();
    window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
  }

  async function openDestination(destination) {
    if (!shareUrl) return;
    const opened = window.open(destination.href, '_blank', 'noopener,noreferrer,width=720,height=640');
    if (!opened) {
      await copyLink();
      toast.error(`${destination.label} could not be opened. Link copied instead.`);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-xl" onMouseDown={onClose}>
      <motion.section
        className="w-full max-w-2xl rounded-xl border border-white/[0.08] bg-[#1d1d1f] p-5 text-white shadow-[0_30px_120px_rgba(0,0,0,.62)]"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold">Share</h2>
            <p className="mt-1 truncate text-sm text-white/55">{item.name}</p>
          </div>
          <button className="rounded-full p-2 text-white/65 transition hover:bg-white/10 hover:text-white" type="button" onClick={onClose} aria-label="Close share dialog"><X size={20} /></button>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          {shareQuery.isLoading ? (
            <div className="grid min-h-36 place-items-center text-sm text-white/55">Preparing share link...</div>
          ) : shareQuery.isError ? (
            <div className="rounded-lg border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">Could not create the share link right now.</div>
          ) : (
            <>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {destinations.map((destination) => {
                  const Icon = destination.icon;
                  return (
                    <button key={destination.label} type="button" className="grid min-w-20 justify-items-center gap-2 text-sm font-semibold text-white/85 transition hover:text-[#4fdbc8]" onClick={() => openDestination(destination)}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#111]"><Icon size={24} /></span>
                  {destination.label}
                </button>
                  );
                })}
                <button type="button" className="grid min-w-20 justify-items-center gap-2 text-sm font-semibold text-white/85 transition hover:text-[#4fdbc8]" onClick={openDiscord}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-indigo-500 text-white"><MessageCircle size={24} /></span>
                  Discord
                </button>
                <button type="button" className="grid min-w-20 justify-items-center gap-2 text-sm font-semibold text-white/85 transition hover:text-[#4fdbc8]" onClick={nativeShare}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white"><Share2 size={24} /></span>
                  More
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/15 bg-black/20 p-3 sm:flex-row sm:items-center">
                <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
                <button className="btn-secondary shrink-0 rounded-full px-5" type="button" onClick={copyLink}>{copied ? 'Copied' : 'Copy Link'}</button>
              </div>
              <p className="mt-3 text-xs text-white/35">Browsers can share the actual file only when Web Share supports file objects; otherwise CloudNest shares the public link.</p>
            </>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function formatShareText(item, shareUrl) {
  return `${formatShareHeadline(item)}\n\n${shareUrl}`;
}

function formatShareHeadline(item) {
  return `${shareEmojiForFile(item)} ${item.name}`;
}

function shareEmojiForFile(item) {
  const extension = String(item.extension || item.name?.split('.').pop() || '').replace(/^\./, '').toLowerCase();
  const mimeType = String(item.mimeType || '').toLowerCase();
  const fileType = String(item.fileType || item.category || '').toLowerCase();

  if (fileType === 'image' || mimeType.startsWith('image/')) return '\u{1F4F7}';
  if (fileType === 'video' || mimeType.startsWith('video/')) return '\u{1F3A5}';
  if (fileType === 'audio' || mimeType.startsWith('audio/')) return '\u{1F3B5}';
  if (fileType === 'pdf' || mimeType === 'application/pdf' || extension === 'pdf') return '\u{1F4C4}';
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension) || mimeType.includes('word')) return '\u{1F4DD}';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(extension) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '\u{1F4CA}';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || mimeType.includes('zip') || mimeType.includes('archive')) return '\u{1F5DC}';
  return '\u{1F4C1}';
}

function buildAbsoluteShareUrl(apiUrl, token) {
  const fallbackPath = token ? `/share/${token}` : '';
  const source = apiUrl || fallbackPath;
  if (!source) return '';

  try {
    const configuredOrigin = getConfiguredFrontendOrigin();
    const parsed = new URL(source, configuredOrigin);
    if (isLocalhostOrigin(parsed.origin) && configuredOrigin && !isLocalhostOrigin(configuredOrigin)) {
      return new URL(parsed.pathname, configuredOrigin).toString();
    }
    return parsed.toString();
  } catch {
    return source;
  }
}

function getConfiguredFrontendOrigin() {
  const configured = import.meta.env.VITE_APP_URL || import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_CLIENT_URL;
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return import.meta.env.DEV ? 'http://localhost:5173' : '';
}

function isLocalhostOrigin(origin) {
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

async function buildShareFile(item) {
  const sourceUrl = item.secureUrl || item.url;
  if (!sourceUrl || !globalThis.File) return null;
  const response = await fetch(sourceUrl);
  if (!response.ok) return null;
  const blob = await response.blob();
  const type = item.mimeType || blob.type || 'application/octet-stream';
  return new globalThis.File([blob], item.name || 'cloudnest-file', { type });
}
