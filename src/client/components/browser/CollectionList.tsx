import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCollections } from '@/hooks/useCollections'
import { CollectionItem } from './CollectionItem'

export const CollectionList = () => {
  const { data, isLoading, error } = useCollections()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">Loading collections...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error loading collections: {error.message}
        </CardContent>
      </Card>
    )
  }

  if (!data?.entities.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No collections found.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections ({data.total})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.entities.map((collection) => (
          <CollectionItem key={collection.id} collection={collection} />
        ))}
      </CardContent>
    </Card>
  )
}
