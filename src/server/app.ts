import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware, requireAuth } from './middleware/auth.ts';
import { apiRoutes } from './routes/api.ts';
import { authRoutes } from './routes/auth.ts';
import { exportRoutes } from './routes/export.ts';

export type AppEnv = {
  Variables: {
    user?: {
      sub: string;
      email?: string;
      name?: string;
    };
  };
};

export const createApp = () => {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use(
    '*',
    cors({
      origin: ['http://localhost:5173'],
      credentials: true,
    }),
  );

  app.use('*', authMiddleware);

  app.route('/auth', authRoutes);

  app.use('/api/*', requireAuth);
  app.route('/api', apiRoutes);
  app.route('/api/export', exportRoutes);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('/assets/*', serveStatic({ root: './dist/client' }));

  app.get('*', serveStatic({ path: './dist/client/index.html' }));

  return app;
};
