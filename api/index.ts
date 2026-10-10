import type { VercelRequest, VercelResponse } from '@vercel/node';
import healthHandler from './_handlers/health.js';
import authHandler from './_handlers/auth.js';
import farmHandler from './_handlers/farm.js';
import pondsHandler from './_handlers/ponds.js';
import logsHandler from './_handlers/logs.js';
import financeHandler from './_handlers/finance.js';
import alertsHandler from './_handlers/alerts.js';
import environmentalHandler from './_handlers/environmental.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Determine actual pathname from request headers or url
  const rawPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-forwarded-uri'] as string) ||
    req.url ||
    '/';

  const urlObj = new URL(rawPath, 'http://localhost');
  const pathname = urlObj.pathname.replace(/\/$/, '');

  // Ensure query parameters are attached to req.query
  if (!req.query) {
    req.query = {};
  }
  urlObj.searchParams.forEach((val, key) => {
    if (req.query[key] === undefined) {
      req.query[key] = val;
    }
  });

  // Ensure JSON body is parsed if string
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // keep raw string
    }
  }

  // 1. Health check
  if (pathname === '/api/health' || pathname === '/api') {
    return healthHandler(req, res);
  }

  // 2. Auth routes
  if (pathname === '/api/auth/me') {
    return authHandler(req, res, 'me');
  }
  if (pathname === '/api/auth/google') {
    return authHandler(req, res, 'google');
  }
  if (pathname === '/api/auth/dev-login') {
    return authHandler(req, res, 'dev-login');
  }

  // 3. Farm route
  if (pathname === '/api/farm') {
    return farmHandler(req, res);
  }

  // 4. Ponds routes
  if (pathname === '/api/ponds') {
    return pondsHandler(req, res);
  }
  if (pathname.startsWith('/api/ponds/')) {
    const id = pathname.slice('/api/ponds/'.length);
    if (id && !id.includes('/')) {
      req.query.id = id;
      return pondsHandler(req, res);
    }
  }

  // 5. Logs routes
  if (pathname === '/api/logs') {
    return logsHandler(req, res);
  }
  if (pathname.startsWith('/api/logs/')) {
    const id = pathname.slice('/api/logs/'.length);
    if (id && !id.includes('/')) {
      req.query.id = id;
      return logsHandler(req, res);
    }
  }

  // 6. Finance routes
  if (pathname === '/api/finance') {
    return financeHandler(req, res);
  }
  if (pathname.startsWith('/api/finance/')) {
    const id = pathname.slice('/api/finance/'.length);
    if (id && !id.includes('/')) {
      req.query.id = id;
      return financeHandler(req, res);
    }
  }

  // 7. Alerts routes
  if (pathname === '/api/alerts') {
    return alertsHandler(req, res);
  }
  if (pathname.startsWith('/api/alerts/')) {
    const id = pathname.slice('/api/alerts/'.length);
    if (id && !id.includes('/')) {
      req.query.id = id;
      return alertsHandler(req, res);
    }
  }

  // 8. Environmental routes
  if (pathname === '/api/environmental/sync') {
    return environmentalHandler(req, res, 'sync');
  }
  if (pathname === '/api/environmental') {
    return environmentalHandler(req, res);
  }

  // 9. Unmatched API route
  return res.status(404).json({
    error: 'API endpoint not found',
    requestedPath: pathname,
  });
}
