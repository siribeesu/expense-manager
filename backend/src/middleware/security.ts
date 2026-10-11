import { Request, Response, NextFunction } from 'express';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 120; // 120 requests per minute

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http: https:;"
  );
  next();
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - 1).toString());
    return next();
  }

  record.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a minute before retrying.',
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    });
    return;
  }

  next();
}
