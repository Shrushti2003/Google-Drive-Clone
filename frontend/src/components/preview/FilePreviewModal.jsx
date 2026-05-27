import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/apiClient.js';
import { getDriveCategory } from '../../utils/fileCategories.js';
import { canRenderInline, isOfficeDocument } from '../../utils/filePreview.js';
import { useUiStore } from '../../store/uiStore.js';

export function FilePreviewModal() {
  const file = useUiStore((state) => state.preview);
  const files = useUiStore((state) => state.previewFiles);
  const index = useUiStore((state) => state.previewIndex);
  const setPreview = useUiStore((state) => state.setPreview);
  const setPreviewIndex = useUiStore((state) => state.setPreviewIndex);
  const [zoom, setZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');
  const shellRef = useRef(null);
  const url = file?.secureUrl || file?.url;
  const driveCategory = file ? getDriveCategory(file) : '';
  const previewType = file?.fileType || file?.category;

  const canNavigate = files.length > 1;
  const title = useMemo(() => file?.name || 'Preview', [file?.name]);

  useEffect(() => {
    if (!file) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setZoom(1);
    setIsLoaded(false);

    function onKeyDown(event) {
      if (event.key === 'Escape') setPreview(null);
      if (event.key === 'ArrowRight' && canNavigate) setPreviewIndex((index + 1) % files.length);
      if (event.key === 'ArrowLeft' && canNavigate) setPreviewIndex((index - 1 + files.length) % files.length);
      if ((event.ctrlKey || event.metaKey) && event.key === '=') setZoom((value) => Math.min(3, value + 0.25));
      if ((event.ctrlKey || event.metaKey) && event.key === '-') setZoom((value) => Math.max(0.5, value - 0.25));
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canNavigate, file, files.length, index, setPreview, setPreviewIndex]);

  useEffect(() => {
    let objectUrl = '';
    setPreviewUrl('');
    setPreviewError('');
    if (!file || !canRenderInline(file)) return undefined;

    api.get(`/files/${file._id}/preview`, { responseType: 'blob' })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setPreviewUrl(objectUrl);
      })
      .catch(() => setPreviewError('This file could not be prepared for inline preview.'));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  async function download() {
    const { data } = await api.get(`/files/${file._id}/download`);
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  function go(direction) {
    if (!canNavigate) return;
    setPreviewIndex((index + direction + files.length) % files.length);
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await shellRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden bg-black/90 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={shellRef}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,.14),transparent_35%),linear-gradient(180deg,rgba(15,23,42,.38),rgba(0,0,0,.82))]" />

          <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-2xl">
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-semibold text-cyan-50 sm:text-lg">{title}</h2>
              <p className="truncate text-xs text-slate-400">{file.mimeType} {canNavigate ? `- ${index + 1} of ${files.length}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {driveCategory === 'image' && (
                <>
                  <PreviewButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}><Minus size={18} /></PreviewButton>
                  <span className="hidden min-w-12 text-center text-xs text-slate-400 sm:inline">{Math.round(zoom * 100)}%</span>
                  <PreviewButton label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}><Plus size={18} /></PreviewButton>
                  <PreviewButton label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw size={18} /></PreviewButton>
                </>
              )}
              <PreviewButton label="Fullscreen" onClick={toggleFullscreen}><Maximize2 size={18} /></PreviewButton>
              <PreviewButton label="Download" onClick={download}><Download size={18} /></PreviewButton>
              <PreviewButton label="Close" onClick={() => setPreview(null)}><X size={18} /></PreviewButton>
            </div>
          </header>

          {canNavigate && (
            <>
              <PreviewButton label="Previous" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 p-3" onClick={() => go(-1)}><ChevronLeft size={24} /></PreviewButton>
              <PreviewButton label="Next" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 p-3" onClick={() => go(1)}><ChevronRight size={24} /></PreviewButton>
            </>
          )}

          <motion.main
            className="relative z-10 grid h-screen w-screen place-items-center px-4 pb-6 pt-20 sm:px-16"
            initial={{ scale: 0.985, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.985, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {!isLoaded && ['image', 'video', 'pdf'].includes(previewType) && (
              <div className="absolute inset-16 top-24 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
            )}

            {driveCategory === 'image' && (
              <motion.img
                src={url}
                alt={file.name}
                loading="eager"
                drag={zoom > 1}
                dragMomentum={false}
                onLoad={() => setIsLoaded(true)}
                style={{ scale: zoom }}
                className="max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2rem)] select-none rounded-lg object-contain shadow-[0_40px_160px_rgba(0,0,0,.75)] sm:max-w-[calc(100vw-9rem)]"
              />
            )}

            {driveCategory === 'video' && (
              <video
                src={url}
                controls
                playsInline
                preload="metadata"
                onLoadedData={() => setIsLoaded(true)}
                className="max-h-[calc(100vh-7rem)] w-full max-w-6xl rounded-lg bg-black object-contain shadow-[0_40px_160px_rgba(0,0,0,.75)]"
              />
            )}

            {previewType === 'audio' && (
              <div className="premium-card w-full max-w-xl p-8 text-center">
                <h3 className="font-display text-xl font-semibold">{file.name}</h3>
                <audio src={url} controls className="mt-6 w-full" />
              </div>
            )}

            {canRenderInline(file) && previewUrl && (
              <iframe
                title={file.name}
                src={previewUrl}
                onLoad={() => setIsLoaded(true)}
                className="h-[calc(100vh-7rem)] w-full max-w-6xl rounded-lg border border-white/10 bg-white shadow-[0_40px_160px_rgba(0,0,0,.75)]"
              />
            )}

            {driveCategory !== 'image' && driveCategory !== 'video' && previewType === 'pdf' && !previewUrl && (
              <div className="premium-card max-w-md p-8 text-center">
                <h3 className="font-display text-xl font-semibold">Preparing PDF preview</h3>
                <p className="mt-2 text-sm text-slate-500">{previewError || 'Loading the secure inline viewer...'}</p>
                {previewError && <button className="btn-primary mt-5" onClick={download}>Download instead</button>}
              </div>
            )}

            {isOfficeDocument(file) && (
              url ? (
                <iframe
                  title={file.name}
                  src={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`}
                  onLoad={() => setIsLoaded(true)}
                  className="h-[calc(100vh-7rem)] w-full max-w-6xl rounded-lg border border-white/10 bg-white shadow-[0_40px_160px_rgba(0,0,0,.75)]"
                />
              ) : (
                <div className="premium-card max-w-md p-8 text-center">
                  <h3 className="font-display text-xl font-semibold">Office preview unavailable</h3>
                  <p className="mt-2 text-sm text-slate-500">This office document is stored safely and can be downloaded unchanged.</p>
                  <button className="btn-primary mt-5" onClick={download}>Download file</button>
                </div>
              )
            )}

            {driveCategory !== 'image' && driveCategory !== 'video' && !canRenderInline(file) && !isOfficeDocument(file) && previewType !== 'audio' && (
              <div className="premium-card max-w-md p-8 text-center">
                <h3 className="font-display text-xl font-semibold">Preview unavailable</h3>
                <p className="mt-2 text-sm text-slate-500">This file type can still be stored, shared, copied, renamed, and downloaded.</p>
              </div>
            )}
          </motion.main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PreviewButton({ label, className = 'p-2.5', children, ...props }) {
  return (
    <button
      type="button"
      className={`tooltip-button rounded-lg border border-white/10 bg-white/[0.08] text-cyan-50 backdrop-blur-xl transition hover:border-cyan-200/30 hover:bg-white/[0.14] ${className}`}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}
