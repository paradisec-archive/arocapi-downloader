import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ARCHIVAL_AUDIO_TYPES, ARCHIVAL_VIDEO_TYPES, getFileType } from '~/shared/types/file';
import type { Entity, QualityTier, RoCrateFile } from '~/shared/types/index';

type SelectionStateType = 'full' | 'partial' | 'none';

// Helper function for quality filtering
const isFileIncludedWithQuality = (file: RoCrateFile, audioQuality: QualityTier, videoQuality: QualityTier): boolean => {
  // Files without access cannot be selected
  if (file.access?.content === false) {
    return false;
  }

  const fileType = getFileType(file.mediaType);

  if (fileType === 'audio') {
    if (audioQuality === 'archival') {
      return ARCHIVAL_AUDIO_TYPES.includes(file.mediaType);
    }

    return !ARCHIVAL_AUDIO_TYPES.includes(file.mediaType);
  }

  if (fileType === 'video') {
    if (videoQuality === 'archival') {
      return ARCHIVAL_VIDEO_TYPES.includes(file.mediaType);
    }

    return !ARCHIVAL_VIDEO_TYPES.includes(file.mediaType);
  }

  return true;
};

// Primitive atoms
const selectedCollectionsAtom = atom(new Set<string>());
const selectedItemsAtom = atom(new Set<string>());
const selectedFilesAtom = atom(new Set<string>());

const expandedCollectionsAtom = atom(new Set<string>());
const expandedItemsAtom = atom(new Set<string>());

const pendingCollectionsAtom = atom(new Set<string>());
const pendingItemsAtom = atom(new Set<string>());

const collectionItemsAtom = atom(new Map<string, string[]>());
const itemFilesAtom = atom(new Map<string, string[]>());

const audioQualityAtom = atom<QualityTier>('presentation');
const videoQualityAtom = atom<QualityTier>('presentation');

const fileMetadataAtom = atom(new Map<string, RoCrateFile>());

// Derived atoms
const pendingInfoAtom = atom((get) => ({
  pendingCollections: get(pendingCollectionsAtom).size,
  pendingItems: get(pendingItemsAtom).size,
}));

const selectedFilesListAtom = atom((get) => {
  const selectedFiles = get(selectedFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);
  const includedFiles: RoCrateFile[] = [];

  selectedFiles.forEach((fileId) => {
    const file = fileMetadata.get(fileId);
    if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
      includedFiles.push(file);
    }
  });

  return includedFiles;
});

const selectedFileIdsAtom = atom((get) => {
  const selectedFiles = get(selectedFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);
  const includedFiles: string[] = [];

  selectedFiles.forEach((fileId) => {
    const file = fileMetadata.get(fileId);
    if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
      includedFiles.push(fileId);
    }
  });

  return includedFiles;
});

const totalSelectedSizeAtom = atom((get) => {
  const selectedFiles = get(selectedFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);
  let total = 0;

  selectedFiles.forEach((fileId) => {
    const file = fileMetadata.get(fileId);
    if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
      total += file.size;
    }
  });

  return total;
});

// Action atoms
const selectCollectionAtom = atom(null, (get, set, collectionId: string) => {
  const selectedCollections = get(selectedCollectionsAtom);
  const expandedCollections = get(expandedCollectionsAtom);
  const pendingCollections = get(pendingCollectionsAtom);
  const selectedItems = get(selectedItemsAtom);
  const pendingItems = get(pendingItemsAtom);
  const expandedItems = get(expandedItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const collectionItems = get(collectionItemsAtom);
  const itemFiles = get(itemFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);

  const newSelectedCollections = new Set(selectedCollections);
  const newExpandedCollections = new Set(expandedCollections);
  const newPendingCollections = new Set(pendingCollections);
  const newSelectedItems = new Set(selectedItems);
  const newPendingItems = new Set(pendingItems);
  const newExpandedItems = new Set(expandedItems);
  const newSelectedFiles = new Set(selectedFiles);

  newSelectedCollections.add(collectionId);
  newExpandedCollections.add(collectionId);

  const existingItemIds = collectionItems.get(collectionId);
  if (existingItemIds) {
    existingItemIds.forEach((itemId) => {
      newSelectedItems.add(itemId);

      const existingFileIds = itemFiles.get(itemId);
      if (existingFileIds) {
        existingFileIds.forEach((fileId) => {
          const file = fileMetadata.get(fileId);
          if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
            newSelectedFiles.add(fileId);
          }
        });
      } else {
        newPendingItems.add(itemId);
        newExpandedItems.add(itemId);
      }
    });
  } else {
    newPendingCollections.add(collectionId);
  }

  set(selectedCollectionsAtom, newSelectedCollections);
  set(expandedCollectionsAtom, newExpandedCollections);
  set(pendingCollectionsAtom, newPendingCollections);
  set(selectedItemsAtom, newSelectedItems);
  set(pendingItemsAtom, newPendingItems);
  set(expandedItemsAtom, newExpandedItems);
  set(selectedFilesAtom, newSelectedFiles);
});

const deselectCollectionAtom = atom(null, (get, set, collectionId: string) => {
  const selectedCollections = get(selectedCollectionsAtom);
  const pendingCollections = get(pendingCollectionsAtom);
  const selectedItems = get(selectedItemsAtom);
  const pendingItems = get(pendingItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const collectionItems = get(collectionItemsAtom);
  const itemFiles = get(itemFilesAtom);

  const newSelectedCollections = new Set(selectedCollections);
  const newPendingCollections = new Set(pendingCollections);
  const newSelectedItems = new Set(selectedItems);
  const newPendingItems = new Set(pendingItems);
  const newSelectedFiles = new Set(selectedFiles);

  newSelectedCollections.delete(collectionId);
  newPendingCollections.delete(collectionId);

  const itemIds = collectionItems.get(collectionId) || [];
  itemIds.forEach((itemId) => {
    newSelectedItems.delete(itemId);
    newPendingItems.delete(itemId);

    const fileIds = itemFiles.get(itemId) || [];
    fileIds.forEach((fileId) => {
      newSelectedFiles.delete(fileId);
    });
  });

  set(selectedCollectionsAtom, newSelectedCollections);
  set(pendingCollectionsAtom, newPendingCollections);
  set(selectedItemsAtom, newSelectedItems);
  set(pendingItemsAtom, newPendingItems);
  set(selectedFilesAtom, newSelectedFiles);
});

const selectItemAtom = atom(null, (get, set, itemId: string) => {
  const selectedItems = get(selectedItemsAtom);
  const expandedItems = get(expandedItemsAtom);
  const pendingItems = get(pendingItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const itemFiles = get(itemFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);

  const newSelectedItems = new Set(selectedItems);
  const newExpandedItems = new Set(expandedItems);
  const newPendingItems = new Set(pendingItems);
  const newSelectedFiles = new Set(selectedFiles);

  newSelectedItems.add(itemId);
  newExpandedItems.add(itemId);

  const existingFileIds = itemFiles.get(itemId);
  if (existingFileIds) {
    existingFileIds.forEach((fileId) => {
      const file = fileMetadata.get(fileId);
      if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
        newSelectedFiles.add(fileId);
      }
    });
  } else {
    newPendingItems.add(itemId);
  }

  set(selectedItemsAtom, newSelectedItems);
  set(expandedItemsAtom, newExpandedItems);
  set(pendingItemsAtom, newPendingItems);
  set(selectedFilesAtom, newSelectedFiles);
});

const deselectItemAtom = atom(null, (get, set, itemId: string) => {
  const selectedItems = get(selectedItemsAtom);
  const pendingItems = get(pendingItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const itemFiles = get(itemFilesAtom);

  const newSelectedItems = new Set(selectedItems);
  const newPendingItems = new Set(pendingItems);
  const newSelectedFiles = new Set(selectedFiles);

  newSelectedItems.delete(itemId);
  newPendingItems.delete(itemId);

  const fileIds = itemFiles.get(itemId) || [];
  fileIds.forEach((fileId) => {
    newSelectedFiles.delete(fileId);
  });

  set(selectedItemsAtom, newSelectedItems);
  set(pendingItemsAtom, newPendingItems);
  set(selectedFilesAtom, newSelectedFiles);
});

const toggleFileSelectionAtom = atom(null, (get, set, fileId: string) => {
  const selectedFiles = get(selectedFilesAtom);
  const newSet = new Set(selectedFiles);

  if (newSet.has(fileId)) {
    newSet.delete(fileId);
  } else {
    newSet.add(fileId);
  }

  set(selectedFilesAtom, newSet);
});

const registerItemsForCollectionAtom = atom(null, (get, set, { collectionId, items }: { collectionId: string; items: Entity[] }) => {
  const collectionItems = get(collectionItemsAtom);
  const selectedCollections = get(selectedCollectionsAtom);
  const selectedItems = get(selectedItemsAtom);
  const pendingCollections = get(pendingCollectionsAtom);
  const pendingItems = get(pendingItemsAtom);
  const expandedItems = get(expandedItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const itemFiles = get(itemFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);

  const itemIds = items.map((item) => item.id);
  const newCollectionItems = new Map(collectionItems);
  newCollectionItems.set(collectionId, itemIds);
  set(collectionItemsAtom, newCollectionItems);

  if (selectedCollections.has(collectionId)) {
    const newSelectedItems = new Set(selectedItems);
    const newPendingCollections = new Set(pendingCollections);
    const newPendingItems = new Set(pendingItems);
    const newExpandedItems = new Set(expandedItems);
    const newSelectedFiles = new Set(selectedFiles);

    newPendingCollections.delete(collectionId);

    itemIds.forEach((itemId) => {
      newSelectedItems.add(itemId);

      const existingFileIds = itemFiles.get(itemId);
      if (existingFileIds) {
        existingFileIds.forEach((fileId) => {
          const file = fileMetadata.get(fileId);
          if (file && isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
            newSelectedFiles.add(fileId);
          }
        });
      } else {
        newPendingItems.add(itemId);
        newExpandedItems.add(itemId);
      }
    });

    set(selectedItemsAtom, newSelectedItems);
    set(pendingCollectionsAtom, newPendingCollections);
    set(pendingItemsAtom, newPendingItems);
    set(expandedItemsAtom, newExpandedItems);
    set(selectedFilesAtom, newSelectedFiles);
  }
});

const registerFilesForItemAtom = atom(null, (get, set, { itemId, files }: { itemId: string; files: RoCrateFile[] }) => {
  const itemFiles = get(itemFilesAtom);
  const selectedItems = get(selectedItemsAtom);
  const selectedFiles = get(selectedFilesAtom);
  const pendingItems = get(pendingItemsAtom);
  const audioQuality = get(audioQualityAtom);
  const videoQuality = get(videoQualityAtom);

  const fileIds = files.map((file) => file.id);
  const newItemFiles = new Map(itemFiles);
  newItemFiles.set(itemId, fileIds);
  set(itemFilesAtom, newItemFiles);

  if (selectedItems.has(itemId)) {
    const newSelectedFiles = new Set(selectedFiles);
    const newPendingItems = new Set(pendingItems);

    newPendingItems.delete(itemId);

    files.forEach((file) => {
      if (isFileIncludedWithQuality(file, audioQuality, videoQuality)) {
        newSelectedFiles.add(file.id);
      }
    });

    set(selectedFilesAtom, newSelectedFiles);
    set(pendingItemsAtom, newPendingItems);
  }
});

const toggleCollectionExpandAtom = atom(null, (get, set, collectionId: string) => {
  const expandedCollections = get(expandedCollectionsAtom);
  const newSet = new Set(expandedCollections);

  if (newSet.has(collectionId)) {
    newSet.delete(collectionId);
  } else {
    newSet.add(collectionId);
  }

  set(expandedCollectionsAtom, newSet);
});

const toggleItemExpandAtom = atom(null, (get, set, itemId: string) => {
  const expandedItems = get(expandedItemsAtom);
  const newSet = new Set(expandedItems);

  if (newSet.has(itemId)) {
    newSet.delete(itemId);
  } else {
    newSet.add(itemId);
  }

  set(expandedItemsAtom, newSet);
});

const setAudioQualityAtom = atom(null, (get, set, quality: QualityTier) => {
  const selectedItems = get(selectedItemsAtom);
  const itemFiles = get(itemFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const videoQuality = get(videoQualityAtom);

  const newSelectedFiles = new Set<string>();

  selectedItems.forEach((itemId) => {
    const fileIds = itemFiles.get(itemId) || [];
    fileIds.forEach((fileId) => {
      const file = fileMetadata.get(fileId);
      if (file && isFileIncludedWithQuality(file, quality, videoQuality)) {
        newSelectedFiles.add(fileId);
      }
    });
  });

  set(audioQualityAtom, quality);
  set(selectedFilesAtom, newSelectedFiles);
});

const setVideoQualityAtom = atom(null, (get, set, quality: QualityTier) => {
  const selectedItems = get(selectedItemsAtom);
  const itemFiles = get(itemFilesAtom);
  const fileMetadata = get(fileMetadataAtom);
  const audioQuality = get(audioQualityAtom);

  const newSelectedFiles = new Set<string>();

  selectedItems.forEach((itemId) => {
    const fileIds = itemFiles.get(itemId) || [];
    fileIds.forEach((fileId) => {
      const file = fileMetadata.get(fileId);
      if (file && isFileIncludedWithQuality(file, audioQuality, quality)) {
        newSelectedFiles.add(fileId);
      }
    });
  });

  set(videoQualityAtom, quality);
  set(selectedFilesAtom, newSelectedFiles);
});

const addFileMetadataAtom = atom(null, (get, set, files: RoCrateFile[]) => {
  const fileMetadata = get(fileMetadataAtom);
  const newMap = new Map(fileMetadata);

  for (const file of files) {
    newMap.set(file.id, file);
  }

  set(fileMetadataAtom, newMap);
});

const clearSelectionAtom = atom(null, (_get, set) => {
  set(selectedCollectionsAtom, new Set());
  set(selectedItemsAtom, new Set());
  set(selectedFilesAtom, new Set());
  set(pendingCollectionsAtom, new Set());
  set(pendingItemsAtom, new Set());
});

// Helper functions to compute selection states
const getCollectionSelectionState = (
  collectionId: string,
  selectedCollections: Set<string>,
  collectionItems: Map<string, string[]>,
  selectedItems: Set<string>,
  pendingCollections: Set<string>,
  pendingItems: Set<string>,
  itemFiles: Map<string, string[]>,
  selectedFiles: Set<string>,
  fileMetadata: Map<string, RoCrateFile>,
  audioQuality: QualityTier,
  videoQuality: QualityTier,
): SelectionStateType => {
  if (!selectedCollections.has(collectionId)) {
    const itemIds = collectionItems.get(collectionId) || [];
    const hasSelectedItems = itemIds.some((itemId) => selectedItems.has(itemId));

    if (hasSelectedItems) {
      return 'partial';
    }

    return 'none';
  }

  const itemIds = collectionItems.get(collectionId) || [];
  if (itemIds.length === 0 && pendingCollections.has(collectionId)) {
    return 'full';
  }

  const allItemsFullySelected = itemIds.every((itemId) => {
    if (!selectedItems.has(itemId)) return false;
    const fileIds = itemFiles.get(itemId) || [];
    if (fileIds.length === 0 && pendingItems.has(itemId)) {
      return true;
    }

    return fileIds.every((fileId) => {
      const file = fileMetadata.get(fileId);
      if (file && !isFileIncludedWithQuality(file, audioQuality, videoQuality)) return true;

      return selectedFiles.has(fileId);
    });
  });

  return allItemsFullySelected ? 'full' : 'partial';
};

const getItemSelectionState = (
  itemId: string,
  selectedItems: Set<string>,
  pendingItems: Set<string>,
  itemFiles: Map<string, string[]>,
  selectedFiles: Set<string>,
  fileMetadata: Map<string, RoCrateFile>,
  audioQuality: QualityTier,
  videoQuality: QualityTier,
): SelectionStateType => {
  if (!selectedItems.has(itemId)) {
    const fileIds = itemFiles.get(itemId) || [];
    const hasSelectedFiles = fileIds.some((fileId) => selectedFiles.has(fileId));

    if (hasSelectedFiles) {
      return 'partial';
    }

    return 'none';
  }

  const fileIds = itemFiles.get(itemId) || [];
  if (fileIds.length === 0 && pendingItems.has(itemId)) {
    return 'full';
  }

  const allFilesSelected = fileIds.every((fileId) => {
    const file = fileMetadata.get(fileId);
    if (file && !isFileIncludedWithQuality(file, audioQuality, videoQuality)) return true;

    return selectedFiles.has(fileId);
  });

  return allFilesSelected ? 'full' : 'partial';
};

// Helper for components
const isFileIncluded = (file: RoCrateFile, audioQuality: QualityTier, videoQuality: QualityTier): boolean => {
  return isFileIncludedWithQuality(file, audioQuality, videoQuality);
};

// Custom hook for convenient access (similar to Zustand's useStore)
export const useSelectionStore = () => {
  const [selectedCollections] = useAtom(selectedCollectionsAtom);
  const [selectedItems] = useAtom(selectedItemsAtom);
  const [selectedFiles] = useAtom(selectedFilesAtom);
  const [expandedCollections] = useAtom(expandedCollectionsAtom);
  const [expandedItems] = useAtom(expandedItemsAtom);
  const [pendingCollections] = useAtom(pendingCollectionsAtom);
  const [pendingItems] = useAtom(pendingItemsAtom);
  const [collectionItems] = useAtom(collectionItemsAtom);
  const [itemFiles] = useAtom(itemFilesAtom);
  const audioQuality = useAtomValue(audioQualityAtom);
  const videoQuality = useAtomValue(videoQualityAtom);
  const [fileMetadata] = useAtom(fileMetadataAtom);

  const selectCollection = useSetAtom(selectCollectionAtom);
  const deselectCollection = useSetAtom(deselectCollectionAtom);
  const selectItem = useSetAtom(selectItemAtom);
  const deselectItem = useSetAtom(deselectItemAtom);
  const toggleFileSelection = useSetAtom(toggleFileSelectionAtom);
  const registerItemsForCollection = useSetAtom(registerItemsForCollectionAtom);
  const registerFilesForItem = useSetAtom(registerFilesForItemAtom);
  const toggleCollectionExpand = useSetAtom(toggleCollectionExpandAtom);
  const toggleItemExpand = useSetAtom(toggleItemExpandAtom);
  const setAudioQuality = useSetAtom(setAudioQualityAtom);
  const setVideoQuality = useSetAtom(setVideoQualityAtom);
  const addFileMetadata = useSetAtom(addFileMetadataAtom);
  const clearSelection = useSetAtom(clearSelectionAtom);

  const pendingInfo = useAtomValue(pendingInfoAtom);
  const selectedFilesList = useAtomValue(selectedFilesListAtom);
  const selectedFileIds = useAtomValue(selectedFileIdsAtom);
  const totalSelectedSize = useAtomValue(totalSelectedSizeAtom);

  return {
    // State
    selectedCollections,
    selectedItems,
    selectedFiles,
    expandedCollections,
    expandedItems,
    pendingCollections,
    pendingItems,
    collectionItems,
    itemFiles,
    audioQuality,
    videoQuality,
    fileMetadata,

    // Actions
    selectCollection,
    deselectCollection,
    selectItem,
    deselectItem,
    toggleFileSelection,
    registerItemsForCollection: (collectionId: string, items: Entity[]) => registerItemsForCollection({ collectionId, items }),
    registerFilesForItem: (itemId: string, files: RoCrateFile[]) => registerFilesForItem({ itemId, files }),
    toggleCollectionExpand,
    toggleItemExpand,
    setAudioQuality,
    setVideoQuality,
    addFileMetadata,
    clearSelection,

    // Derived
    getPendingInfo: () => pendingInfo,
    getSelectedFiles: () => selectedFilesList,
    getSelectedFileIds: () => selectedFileIds,
    getTotalSelectedSize: () => totalSelectedSize,
    isFileIncluded: (file: RoCrateFile) => isFileIncluded(file, audioQuality, videoQuality),
    getCollectionSelectionState: (collectionId: string) =>
      getCollectionSelectionState(
        collectionId,
        selectedCollections,
        collectionItems,
        selectedItems,
        pendingCollections,
        pendingItems,
        itemFiles,
        selectedFiles,
        fileMetadata,
        audioQuality,
        videoQuality,
      ),
    getItemSelectionState: (itemId: string) =>
      getItemSelectionState(itemId, selectedItems, pendingItems, itemFiles, selectedFiles, fileMetadata, audioQuality, videoQuality),
  };
};
