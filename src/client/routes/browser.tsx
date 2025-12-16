import { createFileRoute } from '@tanstack/react-router'
import { CollectionList } from '@/components/browser/CollectionList'
import { SelectionSummary } from '@/components/browser/SelectionSummary'

export const Route = createFileRoute('/browser')({
  component: BrowserPage,
})

function BrowserPage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Browse Collections</h1>
      </div>

      <CollectionList />

      <SelectionSummary />
    </div>
  )
}
