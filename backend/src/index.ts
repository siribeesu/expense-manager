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

// API routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[PaisaPilot API Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 [PaisaPilot Backend] Server running at http://localhost:${PORT}`);
  console.log(`📡 [PaisaPilot Backend] REST API available at http://localhost:${PORT}/api`);
});

export { app, server };
