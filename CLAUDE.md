# RO-Crate API Downloader

This codebase provides guidance to Claude Code when working on this project.

## Project Overview

A web application for browsing RO-Crate collections hierarchically, selecting files with quality tier filtering, and requesting zip downloads via email.

## Tech Stack

- **Frontend:** React 19, Shadcn/ui, Tailwind CSS 4, TanStack Query, TanStack Router
- **Backend:** TanStack Start (SSR React framework with server functions)
- **State Management:** Jotai (atomic state management)
- **Auth:** Generic OIDC (configurable via env)
- **Infrastructure:** AWS S3 (zip storage), AWS SES (email)

## Project Structure

```
src/
├── routes/                     # TanStack Start file-based routes
│   ├── __root.tsx             # Root layout with HTML document
│   ├── index.tsx              # Home/login page
│   ├── browser.tsx            # Unified browse/search with faceted filtering (protected)
│   ├── export-status.tsx      # Export confirmation
│   └── api/                   # HTTP API routes (for OIDC redirects)
│       └── auth/
│           ├── login.ts       # GET - redirect to OIDC provider
│           ├── callback.ts    # GET - handle OIDC callback
│           └── logout.ts      # GET - clear session, redirect
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   ├── browser/               # Collection/item/file browser
│   ├── search/                # Search UI (SearchBar, FacetPanel, SearchResults, etc.)
│   ├── layout/                # Header
│   └── common/                # LoadingSpinner, FileSize
├── hooks/                      # TanStack Query hooks (useSearch, useEntity, etc.)
├── lib/                        # Utilities
├── store/                      # Jotai stores
├── server/                     # Server-only code
│   ├── functions/             # Server functions (createServerFn)
│   │   ├── auth.ts            # getAuthStatus, getAccessToken
│   │   ├── collections.ts     # getCollections, getItemsInCollection
│   │   ├── items.ts           # getItems, getFilesInItem
│   │   ├── entity.ts          # getEntity
│   │   ├── search.ts          # searchEntities
│   │   └── export.ts          # submitExport
│   └── services/              # Server services
│       ├── config.ts          # Environment config
│       ├── cookies.ts         # Cookie utilities
│       ├── oidc.ts            # OIDC client
│       └── rocrate.ts         # RO-Crate API client
├── shared/                     # Shared types/schemas, constants, formatters
│   ├── constants.ts           # Shared constants
│   ├── formatters.ts          # Display formatting helpers
│   └── types/                 # TypeScript types (api, auth, entity, export, file, search)
├── worker/                     # Export job processor
│   ├── processor.ts           # Job processing logic
│   └── services/              # S3, SES, zipper, RO-Crate fetcher
├── router.tsx                  # Router configuration
└── styles.css                  # Global styles
```

## Development Commands

```bash
pnpm dev          # Run TanStack Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run Vitest tests
pnpm lint:types   # Run TypeScript type checking
pnpm lint:biome   # Run Biome linter
pnpm lint:knip    # Run Knip unused code detection
pnpm docker:build # Build Docker image
pnpm docker:run   # Run Docker container
pnpm docker:test  # Build and run Docker container
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `ROCRATE_API_BASE_URL` - RO-Crate API endpoint
- `OIDC_*` - OIDC authentication settings
- `SESSION_SECRET` - Session encryption key (min 32 chars)
- `AWS_*` - AWS credentials and region
- `S3_BUCKET` - S3 bucket for zip files
- `EMAIL_FROM` - Email sender address

## Key Patterns

### Data Flow

1. Frontend calls server functions (e.g., `getCollections()`)
2. Server functions read access token from cookies
3. Server functions call RO-Crate API services
4. Components render with TanStack Query caching/loading states
5. Selection state stored in Jotai atoms, filtered by quality preferences
6. Export submits file IDs via server function, which runs the processor in background
7. Processor fetches files, creates zip, uploads to S3, emails link

### Authentication

OIDC authentication uses HTTP redirects via API routes:

- `GET /api/auth/login` - Set state cookie, redirect to OIDC provider
- `GET /api/auth/callback` - Exchange code, set session cookies, redirect to /browser
- `GET /api/auth/logout` - Clear cookies, redirect to OIDC logout

Protected routes use `beforeLoad` for server-side auth checks.

### State Management

- **Server state:** TanStack Query for all API data (collections, items, files)
- **Client state:** Jotai atoms for selection, expansion, and quality preferences

### Server Functions

Server functions use `createServerFn` with `.inputValidator()` for type-safe RPC:

```typescript
export const getCollections = createServerFn({ method: 'GET' })
  .inputValidator(paginationSchema)
  .handler(async ({ data }) => {
    const token = getCookie('access_token');
    return rocrate.getCollections(data.limit ?? 50, data.offset ?? 0, token);
  });
```

### Search

The `/browser` route handles both browsing and searching via a unified interface:

- Search state is persisted in URL parameters (`q`, `page`, and facet filter arrays)
- Faceted filtering uses a buffered selection model (Apply/Reset buttons)
- 6 facet categories: `collection_title`, `languages_with_code`, `countries`, `collector_name`, `full_identifier`, `entity_type`
- Search queries and filters are sent to the RO-Crate API `POST /search` endpoint
- Results are grouped by parent collection and paginated
- Facet counts update in response to active filters

### Type Safety

- Shared types in `src/shared/types/`
- Zod schemas for runtime validation
- TypeScript strict mode enabled

## Path Aliases

- `~/*` - `src/*`

## Notes

- The route tree (`src/routeTree.gen.ts`) is auto-generated by TanStack Router plugin
- Export jobs run in the background within the server process (no separate worker)
- Build output goes to `.output/` directory
- Cookie handling uses `@tanstack/react-start/server` utilities

## Maintenance

- Update this CLAUDE.md file at the end of every session when new patterns, components, or architectural changes are introduced
