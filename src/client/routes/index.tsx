import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const handleLogin = () => {
    window.location.href = '/auth/login'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold">RO-Crate Downloader</h1>
      <p className="text-muted-foreground text-lg max-w-md text-center">
        Browse and download files from RO-Crate collections. Select the files you need and receive a
        download link via email.
      </p>
      <Button size="lg" onClick={handleLogin}>
        Sign in to get started
      </Button>
    </div>
  )
}
