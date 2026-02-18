import type { SearchEntity } from '~/shared/types/index';

type SearchResultItemProps = {
  entity: SearchEntity;
};

export const SearchResultItem = ({ entity }: SearchResultItemProps) => {
  return (
    <div className="rounded-lg border p-3">
      <div className="font-medium">{entity.name}</div>
      <div className="text-sm italic text-muted-foreground">{entity.id}</div>
      {entity.description && <div className="mt-1 text-sm text-muted-foreground">{entity.description}</div>}
    </div>
  );
};
