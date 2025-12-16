import { Link } from '@tanstack/react-router'

export const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">
          RO-Crate Downloader
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/browser"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </Link>
        </nav>
      </div>
    </header>
  )
}
