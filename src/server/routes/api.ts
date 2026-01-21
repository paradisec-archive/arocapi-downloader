import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { AppEnv } from '../app.ts';
import * as rocrate from '../services/rocrate.ts';

export const apiRoutes = new Hono<AppEnv>();

apiRoutes.get('/collections', async (c) => {
  const token = getCookie(c, 'access_token');
  const limit = Number(c.req.query('limit') || 50);
  const offset = Number(c.req.query('offset') || 0);

  try {
    const collections = await rocrate.getCollections(limit, offset, token);

    return c.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);

    return c.json({ error: 'Failed to fetch collections' }, 500);
  }
});

apiRoutes.get('/collections/:id', async (c) => {
  const token = getCookie(c, 'access_token');
  const id = c.req.param('id');

  try {
    const collection = await rocrate.getCollection(id, token);

    return c.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);

    return c.json({ error: 'Failed to fetch collection' }, 500);
  }
});

apiRoutes.get('/collections/:id/items', async (c) => {
  const token = getCookie(c, 'access_token');
  const id = c.req.param('id');
  const limit = Number(c.req.query('limit') || 50);
  const offset = Number(c.req.query('offset') || 0);

  try {
    const items = await rocrate.getItemsInCollection(id, limit, offset, token);

    return c.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);

    return c.json({ error: 'Failed to fetch items' }, 500);
  }
});

apiRoutes.get('/items/:id', async (c) => {
  const token = getCookie(c, 'access_token');
  const id = c.req.param('id');

  try {
    const item = await rocrate.getItem(id, token);

    return c.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);

    return c.json({ error: 'Failed to fetch item' }, 500);
  }
});

apiRoutes.get('/items/:id/files', async (c) => {
  const token = getCookie(c, 'access_token');
  const id = c.req.param('id');
  const limit = Number(c.req.query('limit') || 100);
  const offset = Number(c.req.query('offset') || 0);

  try {
    const files = await rocrate.getFilesInItem(id, limit, offset, token);

    return c.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);

    return c.json({ error: 'Failed to fetch files' }, 500);
  }
});

apiRoutes.get('/files/:id', async (c) => {
  const token = getCookie(c, 'access_token');
  const id = c.req.param('id');

  try {
    const file = await rocrate.getFile(id, token);

    return c.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);

    return c.json({ error: 'Failed to fetch file' }, 500);
  }
});
