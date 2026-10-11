import { Request, Response, NextFunction } from 'express';

export const DEFAULT_AUTH_TOKEN = process.env.THRIFTLY_AUTH_TOKEN || 'thriftly-pilot-token-2026';
export const VALID_PIN = process.env.THRIFTLY_PIN || '1234';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Public whitelisted endpoints (health check and auth challenge/verification)
  const isPublic =
    req.path === '/health' ||
    req.path.startsWith('/auth') ||
    req.path === '/api/health' ||
    req.path.startsWith('/api/auth');

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-thriftly-auth'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken || (typeof customHeader === 'string' ? customHeader : null);

  if (!token || token !== DEFAULT_AUTH_TOKEN) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied: valid authorization Bearer token or x-thriftly-auth header required to access financial records.',
    });
    return;
  }

  next();
}
