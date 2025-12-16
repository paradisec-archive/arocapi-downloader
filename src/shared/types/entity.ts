export type EntityType =
  | 'http://pcdm.org/models#Collection'
  | 'http://pcdm.org/models#Object'
  | 'http://schema.org/MediaObject'

export type Entity = {
  id: string
  name: string
  description?: string
  entityType: EntityType
  memberOf?: string
  rootCollection?: string
  licenses?: string[]
}

export type Collection = Entity & {
  entityType: 'http://pcdm.org/models#Collection'
}

export type Item = Entity & {
  entityType: 'http://pcdm.org/models#Object'
  memberOf: string
}
