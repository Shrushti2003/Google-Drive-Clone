import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../services/apiClient.js';

export function UploadDropzone({ folder, openRequestId = 0 }) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      if (folder) form.append('folder', folder);
      const { data } = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      if (import.meta.env.DEV) {
        console.log('[files:upload:response]', data);
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.files.length} file${data.files.length === 1 ? '' : 's'} uploaded`);
      if (import.meta.env.DEV) {
        console.log('[files:upload:classified]', (data.files || []).map((file) => ({
          id: file._id,
          name: file.name,
          mimeType: file.mimeType,
          extension: file.extension,
          category: file.category,
          fileType: file.fileType,
          hasUrl: Boolean(file.secureUrl || file.url)
        })));
      }
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.refetchQueries({ queryKey: ['drive-files'], type: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProgress(0);
    },
    onError: (error) => {
      setProgress(0);
      toast.error(getApiError(error));
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => uploadMutation.mutate(files),
    multiple: true
  });

  useEffect(() => {
    if (openRequestId > 0) fileInputRef.current?.click();
  }, [openRequestId]);

  return (
    <div
      {...getRootProps()}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-8 transition duration-300 ${
        isDragActive ? 'scale-[1.01] border-[#4fdbc8]/50 bg-[#4fdbc8]/10 shadow-[0_0_80px_rgba(79,219,200,.18)]' : 'border-white/[0.05] bg-[#0e1513]/30 backdrop-blur-2xl hover:border-[#4fdbc8]/15'
      }`}
    >
      <input {...getInputProps()} />
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        multiple
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (files.length) uploadMutation.mutate(files);
          event.target.value = '';
        }}
      />
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/[0.05] bg-white/[0.02] transition group-hover:scale-105">
          <UploadCloud className="text-[#4fdbc8]/50" size={28} />
        </div>
        <div>
          <div className="font-display text-lg font-medium text-white/80">{isDragActive ? 'Drop files to upload' : 'Drop files to upload'}</div>
          <p className="mx-auto mt-1 max-w-xs text-xs font-light text-[#bbcac6]/40">Drag and drop any file here to sync with your secure vault.</p>
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.03] px-5 py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.06]">
          <UploadCloud size={16} />
          Upload folder
          <input
            className="hidden"
            type="file"
            multiple
            webkitdirectory=""
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length) uploadMutation.mutate(files);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      <AnimatePresence>
        {uploadMutation.isPending && (
          <motion.div className="absolute inset-x-4 bottom-4 h-1 overflow-hidden rounded-full bg-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="h-full bg-[#4fdbc8] shadow-[0_0_18px_rgba(79,219,200,.7)]" initial={{ width: 0 }} animate={{ width: `${Math.max(progress, 8)}%` }} />
            <span className="absolute -top-6 right-0 text-xs text-[#4fdbc8]">{progress}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
