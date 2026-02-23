import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Checkbox } from '~/components/ui/checkbox';
import type { FacetBucket } from '~/shared/types/search';

const INITIAL_VISIBLE = 5;

type FacetCategorySectionProps = {
  label: string;
  buckets: FacetBucket[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

export const FacetCategorySection = ({ label, buckets, selectedValues, onToggle }: FacetCategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isShowingAll, setIsShowingAll] = useState(false);

  const sortedBuckets = useMemo(() => {
    const selected: FacetBucket[] = [];
    const unselected: FacetBucket[] = [];

    for (const bucket of buckets) {
      if (selectedValues.includes(bucket.name)) {
        selected.push(bucket);
      } else {
        unselected.push(bucket);
      }
    }

    // Add selected values that disappeared from API response with count 0
    for (const value of selectedValues) {
      if (!buckets.some((b) => b.name === value)) {
        selected.push({ name: value, count: 0 });
      }
    }

    return [...selected, ...unselected];
  }, [buckets, selectedValues]);

  const visibleBuckets = isShowingAll ? sortedBuckets : sortedBuckets.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sortedBuckets.length - INITIAL_VISIBLE;

  return (
    <div className="border-b border-border pb-3">
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground/80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {label}
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {isExpanded && (
        <div className="space-y-1.5 pt-1">
          {visibleBuckets.map((bucket) => {
            const isChecked = selectedValues.includes(bucket.name);
            const id = `facet-${label}-${bucket.name}`;

            return (
              <label key={bucket.name} htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50">
                <Checkbox id={id} checked={isChecked} onCheckedChange={() => onToggle(bucket.name)} />
                <span className="flex-1 truncate">{bucket.name}</span>
                <span className="text-xs text-muted-foreground">{bucket.count}</span>
              </label>
            );
          })}

          {hiddenCount > 0 && (
            <button type="button" className="px-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setIsShowingAll(!isShowingAll)}>
              {isShowingAll ? 'Show fewer' : `Show ${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
