export type RoCrateGraphNode = {
  '@id': string;
  '@type'?: string | string[];
  about?: { '@id': string };
  hasPart?: { '@id': string }[];
  [key: string]: unknown;
};

export type RoCrateMetadata = {
  '@context': unknown;
  '@graph': RoCrateGraphNode[];
};
