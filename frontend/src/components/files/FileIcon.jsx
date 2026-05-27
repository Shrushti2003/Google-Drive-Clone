import { Archive, FileAudio, FileText, FileVideo, File as FileBase, Image, FileType } from 'lucide-react';

const iconMap = {
  image: Image,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileType,
  document: FileText,
  archive: Archive,
  other: FileBase
};

export function FileIcon({ category, className = '' }) {
  const Icon = iconMap[category] || FileBase;
  return <Icon className={className} size={22} />;
}
