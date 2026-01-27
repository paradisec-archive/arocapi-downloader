import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { useItems } from '~/hooks/useItems';
import { ItemRow } from './ItemRow';

type ItemListProps = {
  collectionId: string;
};

export const ItemList = ({ collectionId }: ItemListProps) => {
  const { data, isLoading, error } = useItems(collectionId, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-muted-foreground">Loading items...</span>
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-sm text-destructive">Error loading items: {error.message}</div>;
  }

  if (!data?.entities.length) {
    return <div className="py-4 text-sm text-muted-foreground">No items found in this collection.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        {data.total} item{data.total !== 1 ? 's' : ''}
      </div>
      {data.entities.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};
