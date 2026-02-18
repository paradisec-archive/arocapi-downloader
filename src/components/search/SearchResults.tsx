import { useMemo } from 'react';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { SearchCollectionGroup } from '~/components/search/SearchCollectionGroup';
import { SearchResultItem } from '~/components/search/SearchResultItem';
import { Pagination } from '~/components/ui/pagination';
import { useSearch } from '~/hooks/useSearch';
import { groupSearchResults } from '~/lib/groupSearchResults';

type SearchResultsProps = {
  query: string;
  page: number;
  onPageChange: (page: number) => void;
};

const RESULTS_PER_PAGE = 50;

export const SearchResults = ({ query, page, onPageChange }: SearchResultsProps) => {
  const offset = (page - 1) * RESULTS_PER_PAGE;

  const { data, isLoading, isError, error } = useSearch({
    query,
    limit: RESULTS_PER_PAGE,
    offset,
  });

  const grouped = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return groupSearchResults(data.entities);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        <p className="font-medium">Failed to search</p>
        <p className="text-sm">{error instanceof Error ? error.message : 'An error occurred'}</p>
      </div>
    );
  }

  if (!data || data.entities.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm">Try a different search term</p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / RESULTS_PER_PAGE);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Found {data.total} result{data.total !== 1 ? 's' : ''} in {data.searchTime}ms
      </p>

      <div className="space-y-3">
        {grouped?.collectionGroups.map((group) => (
          <SearchCollectionGroup key={group.collectionId} collectionId={group.collectionId} collectionEntity={group.collectionEntity} />
        ))}

        {grouped?.other.map((entity) => (
          <SearchResultItem key={entity.id} entity={entity} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};
