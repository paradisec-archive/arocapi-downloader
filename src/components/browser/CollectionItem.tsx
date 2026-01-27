import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import type { Entity } from '~/shared/types/index';
import { useSelectionStore } from '~/store/selectionStore';
import { ItemList } from './ItemList';

type CollectionItemProps = {
  collection: Entity;
};

export const CollectionItem = ({ collection }: CollectionItemProps) => {
  const { expandedCollections, pendingCollections, selectCollection, deselectCollection, toggleCollectionExpand, getCollectionSelectionState } =
    useSelectionStore();

  const selectionState = getCollectionSelectionState(collection.id);
  const isExpanded = expandedCollections.has(collection.id);
  const isPending = pendingCollections.has(collection.id);

  const handleCheckboxChange = () => {
    if (selectionState === 'none') {
      selectCollection(collection.id);
    } else {
      deselectCollection(collection.id);
    }
  };

  const handleExpandClick = () => {
    toggleCollectionExpand(collection.id);
  };

  return (
    <div className="border rounded-lg">
      <div className="flex items-center gap-3 p-3 hover:bg-muted/50">
        <Checkbox
          checked={selectionState === 'full'}
          indeterminate={selectionState === 'partial'}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Select ${collection.name}`}
        />

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleExpandClick} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate flex items-center gap-2">
            {collection.name}
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="italic">{collection.id}</div>
          {collection.description && <div className="text-sm text-muted-foreground truncate">{collection.description}</div>}
        </div>
      </div>

      {isExpanded && (
        <div className="pl-12 pr-3 pb-3">
          <ItemList collectionId={collection.id} />
        </div>
      )}
    </div>
  );
};
