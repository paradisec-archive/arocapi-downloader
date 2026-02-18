import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { ItemList } from '~/components/browser/ItemList';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { useEntity } from '~/hooks/useEntity';
import type { SearchEntity } from '~/shared/types/index';
import { useSelectionStore } from '~/store/selectionStore';

type SearchCollectionGroupProps = {
  collectionId: string;
  collectionEntity?: SearchEntity | undefined;
};

export const SearchCollectionGroup = ({ collectionId, collectionEntity }: SearchCollectionGroupProps) => {
  const { expandedCollections, pendingCollections, selectCollection, deselectCollection, toggleCollectionExpand, getCollectionSelectionState } =
    useSelectionStore();

  const { data: fetchedEntity, isLoading: isEntityLoading } = useEntity(collectionEntity ? undefined : collectionId);

  const collectionName = collectionEntity?.name ?? fetchedEntity?.name ?? collectionId;
  const collectionDescription = collectionEntity?.description ?? fetchedEntity?.description;

  const selectionState = getCollectionSelectionState(collectionId);
  const isExpanded = expandedCollections.has(collectionId);
  const isPending = pendingCollections.has(collectionId);

  const handleCheckboxChange = () => {
    if (selectionState === 'none') {
      selectCollection(collectionId);
    } else {
      deselectCollection(collectionId);
    }
  };

  const handleExpandClick = () => {
    toggleCollectionExpand(collectionId);
  };

  return (
    <div className="border rounded-lg">
      <div className="flex items-center gap-3 p-3 hover:bg-muted/50">
        <Checkbox
          checked={selectionState === 'full'}
          indeterminate={selectionState === 'partial'}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Select ${collectionName}`}
        />

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleExpandClick} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate flex items-center gap-2">
            {isEntityLoading ? <LoadingSpinner size="sm" /> : collectionName}
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="italic">{collectionId}</div>
          {collectionDescription && <div className="text-sm text-muted-foreground truncate">{collectionDescription}</div>}
        </div>
      </div>

      {isExpanded && (
        <div className="pl-12 pr-3 pb-3">
          <ItemList collectionId={collectionId} />
        </div>
      )}
    </div>
  );
};
