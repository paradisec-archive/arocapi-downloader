import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/export-status')({
  component: ExportStatusPage,
})

function ExportStatusPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Export Request Submitted</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your download request has been submitted successfully. You will receive an email with a
            download link when your files are ready.
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a few minutes depending on the size of your selection.
          </p>
          <Button asChild>
            <Link to="/browser">Browse More Collections</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
