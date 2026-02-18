import { getMemberOfId } from '~/lib/getMemberOfId';
import type { SearchEntity } from '~/shared/types/index';

type CollectionGroup = {
  collectionId: string;
  collectionEntity?: SearchEntity | undefined;
  items: SearchEntity[];
};

type GroupedSearchResults = {
  collectionGroups: CollectionGroup[];
  other: SearchEntity[];
  missingCollectionIds: string[];
};

const isCollection = (entityType: string): boolean => {
  return entityType.includes('Collection');
};

const isItem = (entityType: string): boolean => {
  return entityType.includes('Object');
};

export const groupSearchResults = (entities: SearchEntity[]): GroupedSearchResults => {
  const collectionGroupMap = new Map<string, CollectionGroup>();
  const collectionOrder: string[] = [];
  const other: SearchEntity[] = [];

  // First pass: register all collections
  entities.forEach((entity) => {
    if (isCollection(entity.entityType)) {
      if (!collectionGroupMap.has(entity.id)) {
        collectionOrder.push(entity.id);
      }
      collectionGroupMap.set(entity.id, {
        collectionId: entity.id,
        collectionEntity: entity,
        items: collectionGroupMap.get(entity.id)?.items ?? [],
      });
    }
  });

  // Second pass: group items by memberOf
  entities.forEach((entity) => {
    if (isItem(entity.entityType)) {
      const collectionId = getMemberOfId(entity.memberOf);
      if (collectionId) {
        const existing = collectionGroupMap.get(collectionId);
        if (existing) {
          existing.items.push(entity);
        } else {
          collectionOrder.push(collectionId);
          collectionGroupMap.set(collectionId, {
            collectionId,
            collectionEntity: undefined,
            items: [entity],
          });
        }
      } else {
        other.push(entity);
      }
    } else if (!isCollection(entity.entityType)) {
      other.push(entity);
    }
  });

  const collectionGroups = collectionOrder.map((id) => collectionGroupMap.get(id)).filter((group): group is CollectionGroup => group !== undefined);
  const missingCollectionIds = collectionGroups.filter((group) => !group.collectionEntity).map((group) => group.collectionId);

  return { collectionGroups, other, missingCollectionIds };
};
