import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api';
import { securityHeadersMiddleware, rateLimiterMiddleware } from './middleware/security';

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(securityHeadersMiddleware);
app.use(cors());
app.use(express.json({ limit: '100kb' })); // Mitigate body flooding
app.use(rateLimiterMiddleware);

// API routes (supports both /api path prefix and root rewrites)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Thriftly API Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 [Thriftly Backend] Server running at http://localhost:${PORT}`);
  console.log(`📡 [Thriftly Backend] REST API available at http://localhost:${PORT}/api`);
});

export { app, server };
export default app;
