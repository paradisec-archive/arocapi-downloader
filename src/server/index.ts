import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { config } from './services/config.ts';

const app = createApp();

console.log(`Starting server on port ${config.PORT}...`);

serve({
  fetch: app.fetch,
  port: config.PORT,
});

console.log(`Server running at http://localhost:${config.PORT}`);
