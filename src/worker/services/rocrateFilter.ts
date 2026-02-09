import type { RoCrateMetadata } from '~/shared/types/index';

/**
 * Filter an RO-Crate metadata document to only include entries
 * whose @id is in the keptIds set.
 *
 * Finds the descriptor node (ro-crate-metadata.json), follows its
 * about to the root dataset, removes hasPart entries not in keptIds,
 * and removes the corresponding nodes from the graph.
 */
export const filterRoCrate = (metadata: RoCrateMetadata, keptIds: Set<string>): RoCrateMetadata => {
  const graph = metadata['@graph'];

  // Find the descriptor node
  const descriptor = graph.find((node) => node['@id'] === 'ro-crate-metadata.json');
  if (!descriptor?.about) {
    console.error('Descriptor node with about property not found in RO-Crate metadata');
    return metadata;
  }

  const rootId = descriptor.about['@id'];

  // Find the root dataset node
  const rootDataset = graph.find((node) => node['@id'] === rootId);
  if (!rootDataset) {
    console.error(`Root dataset node with @id ${rootId} not found in RO-Crate metadata`);
    return metadata;
  }

  if (!rootDataset.hasPart) {
    console.error('Root dataset node does not have hasPart property');
    return metadata;
  }

  // Find hasPart IDs to remove (those not in keptIds)
  const idsToRemove = new Set<string>();
  rootDataset.hasPart.forEach((part) => {
    if (!keptIds.has(part['@id'])) {
      idsToRemove.add(part['@id']);
    }
  });

  if (idsToRemove.size === 0) {
    return metadata;
  }

  // Filter hasPart and graph
  const filteredGraph = graph
    .filter((node) => !idsToRemove.has(node['@id']))
    .map((node) => {
      if (node['@id'] !== rootId || !node.hasPart) {
        return node;
      }

      return {
        ...node,
        hasPart: node.hasPart.filter((part) => !idsToRemove.has(part['@id'])),
      };
    });

  return { ...metadata, '@graph': filteredGraph };
};
