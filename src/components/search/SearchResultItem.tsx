import { CollectionItem } from '~/components/browser/CollectionItem';
import { ItemRow } from '~/components/browser/ItemRow';
import type { Entity, EntityType, SearchEntity } from '~/shared/types/index';

type SearchResultItemProps = {
  entity: SearchEntity;
};

const convertToEntity = (searchEntity: SearchEntity): Entity => {
  return {
    id: searchEntity.id,
    name: searchEntity.name,
    description: searchEntity.description,
    entityType: searchEntity.entityType as EntityType,
    memberOf: searchEntity.memberOf ? { id: searchEntity.memberOf, name: '' } : undefined,
    rootCollection: searchEntity.rootCollection,
  };
};

const isCollection = (entityType: string): boolean => {
  return entityType.includes('Collection');
};

const isItem = (entityType: string): boolean => {
  return entityType.includes('Object');
};

export const SearchResultItem = ({ entity }: SearchResultItemProps) => {
  const convertedEntity = convertToEntity(entity);

  if (isCollection(entity.entityType)) {
    return <CollectionItem collection={convertedEntity} />;
  }

  if (isItem(entity.entityType)) {
    return <ItemRow item={convertedEntity} />;
  }

  // For unknown entity types, show a simple card
  return (
    <div className="rounded-lg border p-3">
      <div className="font-medium">{entity.name}</div>
      <div className="text-sm italic text-muted-foreground">{entity.id}</div>
      {entity.description && <div className="mt-1 text-sm text-muted-foreground">{entity.description}</div>}
    </div>
  );
};
