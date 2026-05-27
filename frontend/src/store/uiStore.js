import { create } from 'zustand';

export const useUiStore = create((set) => ({
  viewMode: 'grid',
  preview: null,
  previewFiles: [],
  previewIndex: 0,
  commandOpen: false,
  driveSearch: '',
  driveSection: '',
  currentFolderId: 'all',
  uploadRequestId: 0,
  setViewMode: (viewMode) => set({ viewMode }),
  setPreview: (preview, previewFiles = [], previewIndex = 0) => set({ preview, previewFiles, previewIndex }),
  setPreviewIndex: (previewIndex) => set((state) => ({
    previewIndex,
    preview: state.previewFiles[previewIndex] || state.preview
  })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setDriveSearch: (driveSearch) => set({ driveSearch }),
  setDriveSection: (driveSection) => set({ driveSection }),
  setCurrentFolderId: (currentFolderId) => set({ currentFolderId, driveSection: '', driveSearch: '' }),
  requestUpload: () => set((state) => ({ uploadRequestId: state.uploadRequestId + 1, driveSection: '' }))
}));
