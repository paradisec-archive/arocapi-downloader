import { Hono } from 'hono'
import type { AppEnv } from '../app.ts'

export const authRoutes = new Hono<AppEnv>()

authRoutes.get('/login', (c) => {
  // TODO: Implement OIDC login redirect
  return c.redirect('/auth/callback?mock=true')
})

authRoutes.get('/callback', async (c) => {
  // TODO: Implement OIDC callback handling
  // For now, set a mock user for development
  const _mockUser = {
    sub: 'mock-user-id',
    email: 'user@example.com',
    name: 'Test User',
  }

  // In production, this would validate the OIDC callback and create a session
  return c.redirect('/browser')
})

authRoutes.get('/logout', (c) => {
  // TODO: Implement session destruction
  return c.redirect('/')
})

authRoutes.get('/me', (c) => {
  // TODO: Return actual authenticated user from session
  const user = c.get('user')

  if (!user) {
    return c.json({ authenticated: false }, 401)
  }

  return c.json({
    authenticated: true,
    user,
  })
})
