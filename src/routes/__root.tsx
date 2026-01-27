/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Header } from '~/components/layout/Header';
import '~/styles.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'RO-Crate Downloader' }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
          <footer className="border-t py-4 text-center text-sm text-muted-foreground">RO-Crate Downloader</footer>
        </div>

        {/* <ReactQueryDevtools buttonPosition="bottom-left" /> */}
        {/* <TanStackRouterDevtools position="bottom-right" /> */}

        <Scripts />
      </body>
    </html>
  );
}

// import type { QueryClient } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
//
// export const Route = createRootRouteWithContext<RouterContext>()({
// });
