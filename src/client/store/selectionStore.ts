import { ARCHIVAL_AUDIO_TYPES, ARCHIVAL_VIDEO_TYPES, getFileType } from '@shared/types/file'
import type { Entity, QualityTier, RoCrateFile } from '@shared/types/index'
import { create } from 'zustand'

type SelectionStateType = 'full' | 'partial' | 'none'

type SelectionState = {
  selectedCollections: Set<string>
  selectedItems: Set<string>
  selectedFiles: Set<string>

  expandedCollections: Set<string>
  expandedItems: Set<string>

  pendingCollections: Set<string>
  pendingItems: Set<string>

  collectionItems: Map<string, string[]>
  itemFiles: Map<string, string[]>

  audioQuality: QualityTier
  videoQuality: QualityTier

  fileMetadata: Map<string, RoCrateFile>

  selectCollection: (id: string) => void
  deselectCollection: (id: string) => void
  selectItem: (itemId: string, collectionId?: string) => void
  deselectItem: (id: string) => void
  toggleFileSelection: (id: string) => void

  registerItemsForCollection: (collectionId: string, items: Entity[]) => void
  registerFilesForItem: (itemId: string, files: RoCrateFile[]) => void

  toggleCollectionExpand: (id: string) => void
  toggleItemExpand: (id: string) => void

  setAudioQuality: (quality: QualityTier) => void
  setVideoQuality: (quality: QualityTier) => void

  addFileMetadata: (files: RoCrateFile[]) => void

  clearSelection: () => void

  getSelectedFileIds: () => string[]
  getTotalSelectedSize: () => number
  isFileIncluded: (file: RoCrateFile) => boolean
  getCollectionSelectionState: (collectionId: string) => SelectionStateType
  getItemSelectionState: (itemId: string) => SelectionStateType
  getPendingInfo: () => { pendingCollections: number; pendingItems: number }
}

const isFileIncludedWithQuality = (
  file: RoCrateFile,
  audioQuality: QualityTier,
  videoQuality: QualityTier
): boolean => {
  // Files without access cannot be selected
  if (file.access?.content === false) {
    return false
  }

  const fileType = getFileType(file.mediaType)

  if (fileType === 'audio') {
    if (audioQuality === 'archival') {
      return ARCHIVAL_AUDIO_TYPES.includes(file.mediaType)
    }

    return !ARCHIVAL_AUDIO_TYPES.includes(file.mediaType)
  }

  if (fileType === 'video') {
    if (videoQuality === 'archival') {
      return ARCHIVAL_VIDEO_TYPES.includes(file.mediaType)
    }

    return !ARCHIVAL_VIDEO_TYPES.includes(file.mediaType)
  }

  return true
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedCollections: new Set(),
  selectedItems: new Set(),
  selectedFiles: new Set(),

  expandedCollections: new Set(),
  expandedItems: new Set(),

  pendingCollections: new Set(),
  pendingItems: new Set(),

  collectionItems: new Map(),
  itemFiles: new Map(),

  audioQuality: 'presentation',
  videoQuality: 'presentation',

  fileMetadata: new Map(),

  selectCollection: (collectionId) =>
    set((state) => {
      const newSelectedCollections = new Set(state.selectedCollections)
      const newExpandedCollections = new Set(state.expandedCollections)
      const newPendingCollections = new Set(state.pendingCollections)
      const newSelectedItems = new Set(state.selectedItems)
      const newPendingItems = new Set(state.pendingItems)
      const newExpandedItems = new Set(state.expandedItems)
      const newSelectedFiles = new Set(state.selectedFiles)

      newSelectedCollections.add(collectionId)

      // Auto-expand if not already expanded
      newExpandedCollections.add(collectionId)

      // Check if items are already loaded
      const existingItemIds = state.collectionItems.get(collectionId)
      if (existingItemIds) {
        // Select all items
        existingItemIds.forEach((itemId) => {
          newSelectedItems.add(itemId)

          // Check if files are loaded for each item
          const existingFileIds = state.itemFiles.get(itemId)
          if (existingFileIds) {
            existingFileIds.forEach((fileId) => {
              const file = state.fileMetadata.get(fileId)
              if (file && get().isFileIncluded(file)) {
                newSelectedFiles.add(fileId)
              }
            })
          } else {
            // Mark item as pending (files not yet loaded)
            newPendingItems.add(itemId)
            // Auto-expand item to trigger file loading
            newExpandedItems.add(itemId)
          }
        })
      } else {
        // Items not loaded yet - mark collection as pending
        newPendingCollections.add(collectionId)
      }

      return {
        selectedCollections: newSelectedCollections,
        expandedCollections: newExpandedCollections,
        pendingCollections: newPendingCollections,
        selectedItems: newSelectedItems,
        pendingItems: newPendingItems,
        expandedItems: newExpandedItems,
        selectedFiles: newSelectedFiles,
      }
    }),

  deselectCollection: (collectionId) =>
    set((state) => {
      const newSelectedCollections = new Set(state.selectedCollections)
      const newPendingCollections = new Set(state.pendingCollections)
      const newSelectedItems = new Set(state.selectedItems)
      const newPendingItems = new Set(state.pendingItems)
      const newSelectedFiles = new Set(state.selectedFiles)

      newSelectedCollections.delete(collectionId)
      newPendingCollections.delete(collectionId)

      // Deselect all items belonging to this collection
      const itemIds = state.collectionItems.get(collectionId) || []
      itemIds.forEach((itemId) => {
        newSelectedItems.delete(itemId)
        newPendingItems.delete(itemId)

        // Deselect all files belonging to this item
        const fileIds = state.itemFiles.get(itemId) || []
        fileIds.forEach((fileId) => {
          newSelectedFiles.delete(fileId)
        })
      })

      return {
        selectedCollections: newSelectedCollections,
        pendingCollections: newPendingCollections,
        selectedItems: newSelectedItems,
        pendingItems: newPendingItems,
        selectedFiles: newSelectedFiles,
      }
    }),

  selectItem: (itemId, _collectionId) =>
    set((state) => {
      const newSelectedItems = new Set(state.selectedItems)
      const newExpandedItems = new Set(state.expandedItems)
      const newPendingItems = new Set(state.pendingItems)
      const newSelectedFiles = new Set(state.selectedFiles)

      newSelectedItems.add(itemId)

      // Auto-expand item to load files
      newExpandedItems.add(itemId)

      // Check if files are already loaded
      const existingFileIds = state.itemFiles.get(itemId)
      if (existingFileIds) {
        existingFileIds.forEach((fileId) => {
          const file = state.fileMetadata.get(fileId)
          if (file && get().isFileIncluded(file)) {
            newSelectedFiles.add(fileId)
          }
        })
      } else {
        // Files not loaded yet - mark item as pending
        newPendingItems.add(itemId)
      }

      return {
        selectedItems: newSelectedItems,
        expandedItems: newExpandedItems,
        pendingItems: newPendingItems,
        selectedFiles: newSelectedFiles,
      }
    }),

  deselectItem: (itemId) =>
    set((state) => {
      const newSelectedItems = new Set(state.selectedItems)
      const newPendingItems = new Set(state.pendingItems)
      const newSelectedFiles = new Set(state.selectedFiles)

      newSelectedItems.delete(itemId)
      newPendingItems.delete(itemId)

      // Deselect all files belonging to this item
      const fileIds = state.itemFiles.get(itemId) || []
      fileIds.forEach((fileId) => {
        newSelectedFiles.delete(fileId)
      })

      return {
        selectedItems: newSelectedItems,
        pendingItems: newPendingItems,
        selectedFiles: newSelectedFiles,
      }
    }),

  toggleFileSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedFiles)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      return { selectedFiles: newSet }
    }),

  registerItemsForCollection: (collectionId, items) =>
    set((state) => {
      const itemIds = items.map((item) => item.id)
      const newCollectionItems = new Map(state.collectionItems)
      newCollectionItems.set(collectionId, itemIds)

      // If this collection is selected, select all its items
      if (state.selectedCollections.has(collectionId)) {
        const newSelectedItems = new Set(state.selectedItems)
        const newPendingCollections = new Set(state.pendingCollections)
        const newPendingItems = new Set(state.pendingItems)
        const newExpandedItems = new Set(state.expandedItems)
        const newSelectedFiles = new Set(state.selectedFiles)

        newPendingCollections.delete(collectionId)

        itemIds.forEach((itemId) => {
          newSelectedItems.add(itemId)

          // Check if files are already loaded for this item
          const existingFileIds = state.itemFiles.get(itemId)
          if (existingFileIds) {
            existingFileIds.forEach((fileId) => {
              const file = state.fileMetadata.get(fileId)
              if (file && get().isFileIncluded(file)) {
                newSelectedFiles.add(fileId)
              }
            })
          } else {
            // Items become pending until their files are loaded
            newPendingItems.add(itemId)
            // Auto-expand items to trigger file loading
            newExpandedItems.add(itemId)
          }
        })

        return {
          collectionItems: newCollectionItems,
          selectedItems: newSelectedItems,
          pendingCollections: newPendingCollections,
          pendingItems: newPendingItems,
          expandedItems: newExpandedItems,
          selectedFiles: newSelectedFiles,
        }
      }

      return { collectionItems: newCollectionItems }
    }),

  registerFilesForItem: (itemId, files) =>
    set((state) => {
      const fileIds = files.map((file) => file.id)
      const newItemFiles = new Map(state.itemFiles)
      newItemFiles.set(itemId, fileIds)

      // If this item is selected, select all its quality-filtered files
      if (state.selectedItems.has(itemId)) {
        const newSelectedFiles = new Set(state.selectedFiles)
        const newPendingItems = new Set(state.pendingItems)

        newPendingItems.delete(itemId)

        files.forEach((file) => {
          if (get().isFileIncluded(file)) {
            newSelectedFiles.add(file.id)
          }
        })

        return {
          itemFiles: newItemFiles,
          selectedFiles: newSelectedFiles,
          pendingItems: newPendingItems,
        }
      }

      return { itemFiles: newItemFiles }
    }),

  toggleCollectionExpand: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedCollections)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      return { expandedCollections: newSet }
    }),

  toggleItemExpand: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedItems)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }

      return { expandedItems: newSet }
    }),

  setAudioQuality: (quality) =>
    set((state) => {
      // Re-evaluate all files in selected items with new quality
      const newSelectedFiles = new Set<string>()

      state.selectedItems.forEach((itemId) => {
        const fileIds = state.itemFiles.get(itemId) || []
        fileIds.forEach((fileId) => {
          const file = state.fileMetadata.get(fileId)
          if (file && isFileIncludedWithQuality(file, quality, state.videoQuality)) {
            newSelectedFiles.add(fileId)
          }
        })
      })

      return { audioQuality: quality, selectedFiles: newSelectedFiles }
    }),

  setVideoQuality: (quality) =>
    set((state) => {
      // Re-evaluate all files in selected items with new quality
      const newSelectedFiles = new Set<string>()

      state.selectedItems.forEach((itemId) => {
        const fileIds = state.itemFiles.get(itemId) || []
        fileIds.forEach((fileId) => {
          const file = state.fileMetadata.get(fileId)
          if (file && isFileIncludedWithQuality(file, state.audioQuality, quality)) {
            newSelectedFiles.add(fileId)
          }
        })
      })

      return { videoQuality: quality, selectedFiles: newSelectedFiles }
    }),

  addFileMetadata: (files) =>
    set((state) => {
      const newMap = new Map(state.fileMetadata)
      for (const file of files) {
        newMap.set(file.id, file)
      }

      return { fileMetadata: newMap }
    }),

  clearSelection: () =>
    set({
      selectedCollections: new Set(),
      selectedItems: new Set(),
      selectedFiles: new Set(),
      pendingCollections: new Set(),
      pendingItems: new Set(),
    }),

  getSelectedFileIds: () => {
    const state = get()
    const includedFiles: string[] = []

    state.selectedFiles.forEach((fileId) => {
      const file = state.fileMetadata.get(fileId)
      if (file && state.isFileIncluded(file)) {
        includedFiles.push(fileId)
      }
    })

    return includedFiles
  },

  getTotalSelectedSize: () => {
    const state = get()
    let total = 0

    state.selectedFiles.forEach((fileId) => {
      const file = state.fileMetadata.get(fileId)
      if (file && state.isFileIncluded(file)) {
        total += file.size
      }
    })

    return total
  },

  isFileIncluded: (file) => {
    const state = get()

    return isFileIncludedWithQuality(file, state.audioQuality, state.videoQuality)
  },

  getCollectionSelectionState: (collectionId) => {
    const state = get()

    if (!state.selectedCollections.has(collectionId)) {
      // Check if any children are selected
      const itemIds = state.collectionItems.get(collectionId) || []
      const hasSelectedItems = itemIds.some((itemId) => state.selectedItems.has(itemId))

      if (hasSelectedItems) {
        return 'partial'
      }

      return 'none'
    }

    // Collection is selected - check if all children are fully selected
    const itemIds = state.collectionItems.get(collectionId) || []
    if (itemIds.length === 0 && state.pendingCollections.has(collectionId)) {
      return 'full' // Assume full until we know otherwise
    }

    const allItemsFullySelected = itemIds.every((itemId) => {
      if (!state.selectedItems.has(itemId)) return false
      const fileIds = state.itemFiles.get(itemId) || []
      if (fileIds.length === 0 && state.pendingItems.has(itemId)) {
        return true // Assume full until files load
      }

      return fileIds.every((fileId) => {
        const file = state.fileMetadata.get(fileId)
        // Only check files that pass the quality filter
        if (file && !state.isFileIncluded(file)) return true

        return state.selectedFiles.has(fileId)
      })
    })

    return allItemsFullySelected ? 'full' : 'partial'
  },

  getItemSelectionState: (itemId) => {
    const state = get()

    if (!state.selectedItems.has(itemId)) {
      // Check if any files are selected
      const fileIds = state.itemFiles.get(itemId) || []
      const hasSelectedFiles = fileIds.some((fileId) => state.selectedFiles.has(fileId))

      if (hasSelectedFiles) {
        return 'partial'
      }

      return 'none'
    }

    // Item is selected - check if all files are selected
    const fileIds = state.itemFiles.get(itemId) || []
    if (fileIds.length === 0 && state.pendingItems.has(itemId)) {
      return 'full' // Assume full until files load
    }

    const allFilesSelected = fileIds.every((fileId) => {
      const file = state.fileMetadata.get(fileId)
      // Only check files that pass the quality filter
      if (file && !state.isFileIncluded(file)) return true

      return state.selectedFiles.has(fileId)
    })

    return allFilesSelected ? 'full' : 'partial'
  },

  getPendingInfo: () => {
    const state = get()

    return {
      pendingCollections: state.pendingCollections.size,
      pendingItems: state.pendingItems.size,
    }
  },
}))
