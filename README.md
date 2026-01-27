# RO-Crate API Downloader

A web application for browsing RO-Crate collections hierarchically, selecting files with quality tier filtering, and requesting zip downloads via email.

## Features

- **Hierarchical Browser:** Navigate Collections → Items → Files with expand/collapse
- **Quality Tier Selection:** Choose between archival (WAV, MKV/MXF) and compressed (MP3) formats
- **File Size Tracking:** View sizes at file, item, and collection levels with running totals
- **Background Export:** Selected files are zipped and uploaded to S3, with download link emailed

## Tech Stack

- **Frontend:** React 19, TanStack Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui
- **Backend:** Hono (Node.js)
- **Infrastructure:** AWS S3, SES, SQS

## Prerequisites

- Node.js 22+
- pnpm
- AWS account with S3, SES, and SQS configured
- OIDC provider for authentication

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```bash
   # RO-Crate API
   ROCRATE_API_BASE_URL=https://your-api.example.com

   # OIDC Authentication
   OIDC_ISSUER=https://your-idp.example.com
   OIDC_CLIENT_ID=your-client-id
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_REDIRECT_URI=http://localhost:3000/auth/callback

   # Session
   SESSION_SECRET=your-secret-at-least-32-characters

   # AWS
   AWS_REGION=ap-southeast-2
   S3_BUCKET=your-bucket
   EMAIL_FROM=noreply@example.com
   ```

3. **Run development servers:**

   ```bash
   pnpm dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend + backend concurrently |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│ Hono Server │────▶│ RO-Crate API│
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  AWS SQS    │
                   └──────┬──────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AWS SES   │◀────│   Worker    │────▶│   AWS S3    │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User browses collections and selects files in the React frontend
2. Export request is sent to Hono backend, which queues a job in SQS
3. Worker polls SQS, downloads files from RO-Crate API, creates zip
4. Zip is uploaded to S3, presigned URL generated
5. Email with download link sent via SES

## Project Structure

```
src/
├── client/           # React SPA
│   ├── routes/       # TanStack Router pages
│   ├── components/   # UI components
│   ├── hooks/        # TanStack Query hooks
│   ├── lib/          # API client, utilities
│   └── store/        # Zustand state management
├── server/           # Hono backend
│   ├── routes/       # API endpoints
│   └── services/     # RO-Crate client, SQS
├── worker/           # Background job processor
│   └── services/     # S3, SES, zip creation
└── shared/           # Shared types, schemas, utilities
```

## AWS Setup

### S3 Bucket

Create a bucket for storing zip files. Configure lifecycle rules to auto-delete files after 24-48 hours.

### SQS Queue

Create a standard queue (or FIFO if you need ordering). Set visibility timeout to at least 10 minutes.

### SES

Verify your sender email address or domain. Ensure you're out of the SES sandbox for production use.

## Deployment

1. Build the application:

   ```bash
   pnpm build
   ```

2. Start the server:

   ```bash
   pnpm start
   ```

3. Run the worker as a separate process:

   ```bash
   pnpm worker
   ```

For production, consider:

- Using a process manager (PM2, systemd)
- Running the worker in a separate container/instance
- Setting up health checks on `/health`

## Licence

ISC
