import express from 'express';
import cors from 'cors';
import { apiRouter } from '../backend/src/routes/api';
import { securityHeadersMiddleware, rateLimiterMiddleware } from '../backend/src/middleware/security';

const app = express();

app.use(securityHeadersMiddleware);
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimiterMiddleware);

// Support both /api and root mounts when invoked by Vercel serverless routing
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Thriftly Vercel API Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
});

export default app;
