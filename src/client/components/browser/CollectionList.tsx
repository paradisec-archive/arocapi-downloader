import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useCollections } from '@/hooks/useCollections';
import { CollectionItem } from './CollectionItem';

const PAGE_SIZE = 50;

type CollectionListProps = {
  page: number;
  onPageChange: (page: number) => void;
};

export const CollectionList = ({ page, onPageChange }: CollectionListProps) => {
  const offset = (page - 1) * PAGE_SIZE;
  const { data, isLoading, error } = useCollections(PAGE_SIZE, offset);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">Loading collections...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error loading collections: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!data?.entities.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No collections found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections ({data.total})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.entities.map((collection) => (
          <CollectionItem key={collection.id} collection={collection} />
        ))}
      </CardContent>
      {totalPages > 1 && (
        <div className="border-t px-6 py-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </Card>
  );
};
