import { cn } from '~/lib/utils';
import type { FacetFilters, Facets } from '~/shared/types/search';

import { FacetCategorySection } from './FacetCategorySection';

const FACET_LABEL_MAP: Record<string, string> = {
  collection_title: 'Collection',
  languages_with_code: 'Language',
  countries: 'Country',
  collector_name: 'Collector',
  full_identifier: 'Identifier',
  entity_type: 'Type',
};

const FACET_ORDER = ['collection_title', 'languages_with_code', 'countries', 'collector_name', 'full_identifier', 'entity_type'];

type FacetPanelProps = {
  facets?: Facets | undefined;
  filters: FacetFilters;
  isFetching: boolean;
  onFiltersChange: (filters: FacetFilters) => void;
};

export const FacetPanel = ({ facets, filters, isFetching, onFiltersChange }: FacetPanelProps) => {
  const hasActiveFilters = Object.values(filters).some((values) => values.length > 0);

  const handleToggle = (key: string, value: string) => {
    const current = filters[key] ?? [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

    const newFilters = { ...filters, [key]: updated };

    // Remove empty arrays
    if (updated.length === 0) {
      delete newFilters[key];
    }

    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const orderedKeys = FACET_ORDER.filter((key) => (facets?.[key] && facets[key].length > 0) || (filters[key] && filters[key].length > 0));

  if (!facets && !hasActiveFilters) {
    return null;
  }

  return (
    <div className={cn('space-y-1', isFetching && 'opacity-60 transition-opacity')}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasActiveFilters && (
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={handleClearAll}>
            Clear all
          </button>
        )}
      </div>

      {orderedKeys.map((key) => (
        <FacetCategorySection
          key={key}
          label={FACET_LABEL_MAP[key] ?? key}
          buckets={facets?.[key] ?? []}
          selectedValues={filters[key] ?? []}
          onToggle={(value) => handleToggle(key, value)}
        />
      ))}
    </div>
  );
};
