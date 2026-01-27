import type { EntityRef } from './file';

export type EntityType = 'http://pcdm.org/models#Collection' | 'http://pcdm.org/models#Object' | 'http://schema.org/MediaObject';

export type Entity = {
  id: string;
  name: string;
  description?: string | undefined;
  entityType: EntityType;
  memberOf?: EntityRef | undefined;
  rootCollection?: string | undefined;
  licenses?: string[] | undefined;
};

export type Collection = Entity & {
  entityType: 'http://pcdm.org/models#Collection';
};

export type Item = Entity & {
  entityType: 'http://pcdm.org/models#Object';
  memberOf: EntityRef;
};
