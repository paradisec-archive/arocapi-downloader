import { useQuery } from '@tanstack/react-query';
import { getEntity } from '~/server/functions/entity';

export const useEntity = (entityId: string | undefined) => {
  return useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => getEntity({ data: { id: entityId as string } }),
    staleTime: 5 * 60 * 1000,
    enabled: !!entityId,
  });
};
